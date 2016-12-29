var mongo = require('mongodb');
var async = require('async');

module.exports = function(url, date, exclude, callback) {
  var resultes = {};

  mongo.MongoClient.connect(url, function (err, db) {
    if (err) throw err;

    db.collections(function (err, collections) {

      var cols = [];
      collections.forEach(function (col) {
        var name = name = col.collectionName;
        var isOps = name.indexOf('o_') === 0;
        if (isOps && exclude.indexOf(name) === -1) {
          cols.push(name);
        }
      });

      if (!callback) console.log('Collections: ', cols.join(', '));

      async.eachSeries(cols, cleanCollection.bind(null, db), function () {
        db.close();
        if (callback) {
          callback(null, resultes);
        } else {
          process.exit();
        }
      });
    });

  });

  function cleanCollection(db, oplogsCollectionName, done){
    var snapshotsCollectionName = oplogsCollectionName.split('o_')[1];

    if (!snapshotsCollectionName) {
      throw new Error('Cant get collection name from ops-collection: ' + oplogsCollectionName);
    }

    var snapshotsCollection = db.collection(snapshotsCollectionName);
    var oplogsCollection = db.collection(oplogsCollectionName);

    var skip = 0;
    var counter = 0;
    async.forever(function(next) {
      snapshotsCollection.find().project({
        _id: 1,
        _v: 1
      }).limit(1000).skip(skip * 1000).toArray(function (err, snapshots) {
        if (err) throw err;

        snapshots = snapshots || [];

        if (snapshots.length === 0){
          return next('done');
        }

        async.eachSeries(snapshots, function (snapshot, cb) {
          var query = {
            'v': {$ne: snapshot._v - 1},
            'm.ts': {$lt: date}
          };

          query.d = snapshot._id;


          oplogsCollection.remove(query, function (err, res) {
            counter += res.result.n;
            cb()
          });
        }, function () {
          if (!callback) console.log(oplogsCollectionName, counter);
          skip++;
          next();
        });

      });
    }, function(){
      resultes[oplogsCollectionName] = counter;
      done();
    });
  }
};

