const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// Change the working directory based on an environment variable, if provided
const workingDir = process.env.WORKING_DIR || process.cwd();
process.chdir(workingDir);

// directories for migrate-mongo
const migrationsDir = path.join(process.cwd(), './migrations');
const migrationScriptsDir = path.join(migrationsDir, 'scripts');
const migrateMongoConfigPath = path.join(migrationsDir, './migrate-mongo-config.js');
// const migrateMongoConfig = require(migrateMongoConfigPath);

async function applyMigrations() {

    process.chdir(migrationScriptsDir + '/schemas');
    exec(`npx migrate-mongo up -f ${migrateMongoConfigPath} -md .`, (err, stdout, stderr) => {
        if (err) {
            console.error(err);
            return;
        }
        console.log(stdout);

        process.chdir(migrationScriptsDir + '/test-data');
        exec(`npx migrate-mongo down -f ${migrateMongoConfigPath} -md .`, (err, stdout, stderr) => {
            if (err) {
                console.error(err);
                return;
            }
            console.log(stdout);

            exec(`npx migrate-mongo up -f ${migrateMongoConfigPath} -md .`, (err, stdout, stderr) => {
                if (err) {
                    console.error(err);
                    return;
                }
                console.log(stdout);
            });
        });
    });
}

module.exports = { applyMigrations }