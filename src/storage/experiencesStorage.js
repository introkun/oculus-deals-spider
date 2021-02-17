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

    experiences.forEach((experience) => {
      this.db.update({url: experience.url}, experience, {upsert: true},
          function(err) {
            if (err) {
              console.log(`Error updating DB ${this.experiencesDbPath}: ${err}`);
              return;
            }
          }.bind(this));
    });
  }
}

export default ExperiencesStorage;
