var mongo = require('mongodb');
var async = require('async');

var url = process.env.MONGO_URL || 'mongodb://localhost:27017/test';

mongo.MongoClient.connect(url, function(err, db){
  if(err) throw err;

  var date = weekAgo();

  db.collections(function(err, collections) {

    async.eachSeries(collections, function(col, cb){
      var name = col.collectionName;

      if (name.indexOf('_ops') === -1 || name === 'auths_ops') return cb();

      col.remove({'m.ts': {$lt: date}}, function(err, res){
        console.log('collection', col.collectionName, res.result);
        cb()
      });

    }, function(){
      db.close();
      process.exit()
    });
  });

});

function weekAgo(){
  var oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  return +oneWeekAgo;
}