'use strict';

var redis = require("redis");
var client = redis.createClient();
var async = require('async');

function Ranking(params)
{
    params = params || {};
    if (! params.key) throw new Error('params.key is required.');

    this.key = params.key;
}

/**
 * ranking factory
 * 
 * @param  {string} name ranking name
 * @return {object} ranking object
 */
Ranking.prototype.create = function(name)
{
    var self = this;
    var name = this.key + ':ranking:' + name;
    return {
        /**
         * add ranking member with score
         * if the member already exists, the score would be added to the current score
         * 
         * @param {mixed}   id    the identity of the member, it is an unque id in most cases.
         * @param {number}   score  the score of the member
         * @param {callback} cb    (Error, raw_output)
         */
        add: function(id, score, cb) {
            client.zincrby([name, parseInt(score), id], cb);
        },
        /**
         * pick a ranking list include a specified member
         * 
         * @param  {mixed}   id
         * @param  {object}   params
         * @param {number=}  params.num  the number of members return
         * @param  {callback} cb
         */
        pickList: function(id, params, cb) {
            var self = this;
            if (typeof(params) == 'function') {
                cb = params;
                params = {};
            }

            params.num = params.num || 10;

            self.pick(id, function(err, rank){
                if (err) return cb(err);
                params.page = Math.ceil(rank/params.num);
                self.list(params, cb);
            });
        },
        list: function(params, cb) {
            var num = params.num || 10;
            var page = params.page || 1;

            var max = params.max || '+inf';
            var min = params.min || '-inf';
            var offset = num * (page - 1);
            var mapper = params.mapper || null;
            var raw = params.raw || false;

            var args = [ name, max, min, 'WITHSCORES', 'LIMIT', offset, num ];
            client.zrevrangebyscore(args, function(err, out){
                if (err) return cb(err);
                if (raw) return cb(null, out);
                self.toHashSet(out, offset, cb);
            });
        },
        pick: function(id, cb) {
            var args = [ name, id];
            client.zrevrank(args, cb);
        },
        clear: function(cb) {
            client.del(name, cb);
        },
        count: function(cb) {
            var args = [ name, '-inf', '+inf' ];
            client.zcount(args, cb);
        }
    };
};

Ranking.prototype.toHashSet = function(raw, start, cb) {
    if (typeof(start) == 'function') {
        cb = start;
        start = 0;
    }
    var i = 0;
    var ret = {};
    var ranking = {};
    async.whilst(function(){
        return i < raw.length;
    }, function(next){
        ret[raw[i]] = parseInt(raw[i+1]);
        ranking[raw[i]] = ++start;
        i += 2;
        next();
    }, function(err){
        cb(null, ret, ranking);
    });
}

module.exports = Ranking;