const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const { exec } = require('child_process');

// Change the working directory based on an environment variable, if provided
const workingDir = process.env.WORKING_DIR || process.cwd();
process.chdir(workingDir);

// directories for migrate-mongo
const migrationsDir = path.join(process.cwd(), './migrations');
const migrationScriptsDir = path.join(migrationsDir, 'scripts');
const migrateMongoConfigPath = path.join(migrationsDir, './migrate-mongo-config.js');
const migrateMongoConfig = require(migrateMongoConfigPath);

// Directories which migrate-mongo works on
const schemasDir = path.join(migrationsDir, '../../models');
const testDataModelsDir = path.join(migrationsDir, '../../models-test-data');
const oldSchemasDir = './oldSchemas';

// Ensure the oldSchemas directory exists
if (!fs.existsSync(oldSchemasDir)) {
    fs.mkdirSync(oldSchemasDir);
}

// Ensure the migrationScripts directory exists
if (!fs.existsSync(migrationScriptsDir)) {
    fs.mkdirSync(migrationScriptsDir);
}

async function generateMigration() {
    await mongoose.connect(migrateMongoConfig.mongodb.url, migrateMongoConfig.mongodb.options);
    console.log('Connected to MongoDB');

    const schemaFiles = fs.readdirSync(schemasDir);
    const testDataFiles = fs.readdirSync(testDataModelsDir);

    console.log("schemaFiles " + JSON.stringify(schemaFiles));

    // Process main schema files
    for (const file of schemaFiles) {
        const schemaName = path.basename(file, '.js');
        const oldSchemaPath = path.join(oldSchemasDir, `${schemaName}.json`);
        const schemaModulePath = path.join(schemasDir, file);
        let NewSchema;

        try {
            // Dynamically require the schema file and extract the schema object
            NewSchema = require(schemaModulePath).schema;
        } catch (error) {
            console.error(`Error loading schema file: ${schemaModulePath}`);
            console.error(error);
            continue;
        }

        const newSchema = NewSchema.obj;

        let oldSchema = {};
        if (fs.existsSync(oldSchemaPath)) {
            oldSchema = JSON.parse(fs.readFileSync(oldSchemaPath, 'utf-8'));
        }

        const changes = compareSchemas(oldSchema, newSchema);

        if (changes.length > 0) {
            const migrationName = `update-${schemaName}-schema-${Date.now()}`;

            const currDir = process.cwd();

            // change dir to migrationScriptsDir
            // process.chdir(migrationScriptsDir);
            exec(`npx migrate-mongo create ${migrationName} -f ${migrateMongoConfigPath}`, (error, stdout, stderr) => {
                if (error) {
                    console.error(`Error creating migration file: ${error.message}`);
                    return;
                }

                const migrationFileName = stdout.match(/migrations\/scripts\/(\d+-.*\.js)/)[1];
                const migrationFilePath = migrationScriptsDir + `/${migrationFileName}`;
                const migrationContent = generateMigrationContent(schemaName, changes);

                fs.writeFileSync(migrationFilePath, migrationContent, 'utf-8');
                console.log(`Migration file created: ${migrationFilePath}`);

                // Save the new schema as the old schema for future comparisons
                fs.writeFileSync(oldSchemaPath, JSON.stringify(newSchema, null, 2), 'utf-8');

                // change dir back to currDir
                process.chdir(currDir);
            });
        } else {
            console.log(`No changes detected in the schema for ${schemaName}.`);
        }
    }

    // Process test data models
    for (const file of testDataFiles) {
        const schemaName = path.basename(file, '.test-data.js').toLowerCase();
        const testDataPath = path.join(testDataModelsDir, file);
        let testData;

        try {
            // Dynamically require the test data file
            testData = require(testDataPath);
        } catch (error) {
            console.error(`Error loading test data file: ${testDataPath}`);
            console.error(error);
            continue;
        }

        let currDir = process.cwd();

        // change dir to migrationScriptsDir
        // process.chdir(migrationScriptsDir);

        const migrationName = `add-test-data-${schemaName}-${Date.now()}`;
        exec(`npx migrate-mongo create ${migrationName} -f ${migrateMongoConfigPath}`, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error creating migration file: ${error.message}`);
                return;
            }

            const migrationFileName = stdout.match(/migrations\/scripts\/(\d+-.*\.js)/)[1];
            const migrationFilePath = migrationScriptsDir + `/${migrationFileName}`;
            const migrationContent = generateTestDataMigrationContent(schemaName, testData);

            fs.writeFileSync(migrationFilePath, migrationContent, 'utf-8');
            console.log(`Migration file created: ${migrationFilePath}`);

            // change dir back to currDir
            process.chdir(currDir);
        });
    }

    mongoose.disconnect();
}

function compareSchemas(oldSchema, newSchema) {
    const changes = [];

    for (const key in newSchema) {
        if (!oldSchema.hasOwnProperty(key)) {
            changes.push({ field: key, type: 'add', value: newSchema[key] });
        }
    }

    for (const key in oldSchema) {
        if (!newSchema.hasOwnProperty(key)) {
            changes.push({ field: key, type: 'remove' });
        }
    }

    return changes;
}

function generateMigrationContent(schemaName, changes) {
    const collectionName = schemaName.toLowerCase() + 's'; // Assuming collection names are plural of schema names
    const upCommands = changes.map(change => {
        if (change.type === 'add') {
            return `await db.collection('${collectionName}').updateMany({}, { $set: { ${change.field}: ${JSON.stringify(change.value.default || null)} } });`;
        } else if (change.type === 'remove') {
            return `await db.collection('${collectionName}').updateMany({}, { $unset: { ${change.field}: "" } });`;
        }
        return '';
    }).join('\n');

    const downCommands = changes.map(change => {
        if (change.type === 'add') {
            return `await db.collection('${collectionName}').updateMany({}, { $unset: { ${change.field}: "" } });`;
        } else if (change.type === 'remove') {
            return `await db.collection('${collectionName}').updateMany({}, { $set: { ${change.field}: "" } });`;
        }
        return '';
    }).join('\n');

    return `
  module.exports = {
    async up(db, client) {
      ${upCommands}
    },
    async down(db, client) {
      ${downCommands}
    },
  };`
}

function generateTestDataMigrationContent(schemaName, testData) {
    const collectionName = schemaName + 's'; // Assuming collection names are plural of schema names
    const upCommands = `await db.collection('${collectionName}').insertMany(${JSON.stringify(testData)});`;
    const downCommands = `await db.collection('${collectionName}').deleteMany({ _id: { $in: ${JSON.stringify(testData.map(data => data._id))} } });`;

    return `
  module.exports = {
    async up(db, client) {
      ${upCommands}
    },
    async down(db, client) {
      ${downCommands}
    },
  };`
}

generateMigration();
