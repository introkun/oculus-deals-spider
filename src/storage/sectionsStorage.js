import Datastore from 'nedb';
import config from 'config';

class SectionsStorage {
  constructor() {
    this.sectionsDbPath = config.get('SectionsDbPath');

    this.db = new Datastore({filename: this.sectionsDbPath, autoload: true});
    this.db.ensureIndex({fieldName: 'link', unique: true}, (err) => {
      // ignore
    });
  }

  save(sections) {
    console.log('Saving sections to the DB...');
    sections.forEach((el) => {
      console.log(`section ${el.title} ${el.link}`);
    });

    sections.forEach((section) => {
      this.db.update({link: section.link}, section, {upsert: true},
          function(err) {
            if (err) {
              console.log(`Error updating DB ${this.sectionsDbPath}: ${err}`);
              return;
            }
          }.bind(this));
    });
  }
}

export default SectionsStorage;
