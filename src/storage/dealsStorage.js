import Datastore from 'nedb';
import config from 'config';

class DealsStorage {
  constructor() {
    this.dealsDbPath = config.get('DbPath');

    this.db = new Datastore({filename: this.dealsDbPath, autoload: true});
  }

  async save(deals) {
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7); // minus 7 days

    console.log(`lastWeek: ${lastWeek.toISOString()}`);

    const gamesExpression = deals.map((el) => {
      return {name: el.name};
    });

    console.log(`Looking for existing games in the DB for the last week...`);
    this.db.find({
      createdAt: {
        $gte: lastWeek.toISOString(),
      },
      $or: gamesExpression,
    }, (err, docs) => {
      if (err) {
        console.log(`Error selecting deals from DB: ${err}`);
        return;
      }

      const existingGames = new Set(); // ["game1", "game2"]
      docs.forEach((el) => {
        existingGames.add(el.name);
      });
      console.log(`Found ${existingGames.size} existing deal(s)`);

      deals = deals.filter((el) => {
        return !existingGames.has(el.name);
      });

      if (deals.length == 0) {
        console.log('No items to insert to DB');
        return;
      }

      console.log(`Non-duplicate items to insert into DB: ${deals}`);
      this.db.insert(deals, function(err, newDocs) {
        if (err) {
          console.log(`Error inserting into DB ${this.dealsDbPath}: ${err}`);
          return;
        }
        console.log(`Inserted ${newDocs.length} records into DB ${this.dealsDbPath}`);
      }.bind(this));
    });
  }
}

export default DealsStorage;
