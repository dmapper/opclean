var mongo = require('mongodb');
var async = require('async');

var url = process.env.MONGO_URL || 'mongodb://localhost:27017/test';

var excludes = ['auths_ops'];

var cleanDate = daysAgoFromNow(7);

function cleanCollection(db, oplogsCollectionName, done){
  var snapshotsCollectionName = oplogsCollectionName.split('_ops')[0];

  if (!snapshotsCollectionName) {
    throw new Error('Cant get collection name from ops-collection: ' + oplogsCollectionName);
  }

  var snapshotsCollection = db.collection(snapshotsCollectionName);
  var oplogsCollection = db.collection(oplogsCollectionName);

  snapshotsCollection.find().toArray(function (err, snapshots) {
    if (err) throw err;

    snapshots = snapshots || [];
    var counter = 0;

    async.eachSeries(snapshots, function(snapshot, cb){
      var query = {
        'name': snapshot._id,
        'v': { $ne: snapshot._v - 1 },
        'm.ts': { $lt: cleanDate }
      };

      oplogsCollection.remove(query, function(err, res){

        counter += res.result.n;
        cb()
      });
    }, function(){
      console.log('collection', oplogsCollectionName, counter);
      done();
    });

  });
}

mongo.MongoClient.connect(url, function(err, db){
  if(err) throw err;

  db.collections(function(err, collections) {

    var cols = [];
    collections.forEach(function(col){
      var name = name = col.collectionName;
      if (name.indexOf('_ops') !== -1 && excludes.indexOf(name) === -1){
        cols.push(name);
      }
    });

    console.log('Collections: ', cols.join(', '));

    async.eachSeries(cols, cleanCollection.bind(null, db), function(){
      db.close();
      process.exit()
    });
  });

});

function daysAgoFromNow(days){
  var date = new Date();
  date.setDate(date.getDate() - days);
  return +date;
}