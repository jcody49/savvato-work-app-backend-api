const gm = require('./generate-migrations');
const am = require('./apply-migrations');

gm.generateMigration().then(() => {
    am.applyMigrations().then(r => {

    });
});

