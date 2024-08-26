// In this file you can configure migrate-mongo

module.exports = {
  mongodb: {
    url: 'mongodb://localhost:27017/?directConnection=true&serverSelectionTimeoutMS=2000',

    databaseName: "test",

    options: {
      // useNewUrlParser: true // commented to remove a deprecation warning when connecting
      //   connectTimeoutMS: 3600000, // increase connection timeout to 1 hour
      //   socketTimeoutMS: 3600000, // increase socket timeout to 1 hour
    }
  },

  // The migrations dir, can be an relative or absolute path. Only edit this when really necessary.
  migrationsDir: "migrations/scripts",

  // The mongodb collection where the applied changes are stored. Only edit this when really necessary.
  changelogCollectionName: "changelog",

  // The file extension to create migrations and search for in migration dir 
  migrationFileExtension: ".js",

  // Enable the algorithm to create a checksum of the file contents and use that in the comparison to determin
  // if the file should be run.  Requires that scripts are coded to be run multiple times.
  useFileHash: false,

  moduleSystem: 'commonjs',

  workingDir: '/home/jjames/src/mern-project/savvato-work-app-backend-api/utils'
};

