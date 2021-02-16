import Datastore from 'nedb';
import config from 'config';

class ExperiencesStorage {
  constructor() {
    this.experiencesDbPath = config.get('ExperiencesDbPath');

    this.db = new Datastore({filename: this.experiencesDbPath, autoload: true});
    this.db.ensureIndex({fieldName: 'url', unique: true}, (err) => {
      // ignore
    });
  }

  async save(experiences) {
    console.log('Saving experiences to the DB...');
    experiences.forEach((el) => {
      console.log(`experience ${el.name} ${el.url}`);
    });

    this.db.insert(experiences, function(err, newDocs) {
      if (err) {
        console.log(`Error inserting into DB ${this.experiencesDbPath}: ${err}`);
        return;
      }
      console.log(`Inserted ${newDocs.length} records into DB  ${this.experiencesDbPath}`);
    }.bind(this));
  }
}

export default ExperiencesStorage;
