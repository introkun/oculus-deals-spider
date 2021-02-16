import Datastore from 'nedb';
import config from 'config';

class SectionsStorage {
  constructor() {
    this.sectionsDbPath = config.get('SectionsDbPath');

    this.db = new Datastore({filename: this.sectionsDbPath, autoload: true});
    this.db.ensureIndex({fieldName: 'title', unique: true}, (err) => {
      // ignore
    });
  }

  save(sections) {
    console.log('Saving sections to the DB...');
    sections.forEach((el) => {
      console.log(`section ${el.title} ${el.link}`);
    });

    this.db.insert(sections, function(err, newDocs) {
      if (err) {
        console.log(`Error inserting into DB ${this.sectionsDbPath}: ${err}`);
        return;
      }
      console.log(`Inserted ${newDocs.length} records into DB  ${this.sectionsDbPath}`);
    }.bind(this));
  }
}

export default SectionsStorage;
