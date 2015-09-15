'use strict'

var Ranking = require('../kit/ranking');
var async = require('async');
var ranking = new Ranking({ key : 'test' });

describe('Ranking', function(){

    var r;
    before(function(done){
        r = ranking.create('test');
        r.clear(function(err, cb){
            var i = 0;
            async.whilst(function(){
                return i < 100;
            }, function(next){
                r.add('user' + i, i*10, function(err){
                    if (err) return next(err);
                    i++;
                    next();
                })
            }, function(err){
                if (err) return done(err);
                done();
            });
        });
    });

    it('add', function(done){
        done();
    });

    it('pickList', function(done){
        r.pickList('user56', { num: 20 }, function(err, list, ranking){
            if (err) throw err;
            done();
        });
    });
});