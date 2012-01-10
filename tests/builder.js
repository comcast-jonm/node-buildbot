var Buildbot = require('../buildbot').Buildbot;
var nock = require('nock');
var request = require('request');
var async = require('async');
var logmagic = require('logmagic');
var sprintf = require('sprintf').sprintf;

var base_url = "http://buildbot.example.com"

function setupPollTest() {
  var bb = new Buildbot(base_url);
  var builder = bb.builder('Linux', {'poll_interval': 0});
  return builder;
}

exports['test_buildbot_build_in_progress'] = function(test, assert) {
  var scope = nock(base_url)
                .get('/json/builders/Linux/builds/')
                .replyWithFile(200, __dirname + '/fixtures/in_progress.json');
  bb = setupPollTest();
  bb.start();
  bb.on('in_progress_build', function(build) {
    bb.stop();
    assert.equal(18529, build.number);
    scope.done();
    test.finish();
  });
}

exports['test_buildbot_build_finished'] = function(test, assert) {
  var scope = nock(base_url)
                .get('/json/builders/Linux/builds/')
                .replyWithFile(200, __dirname + '/fixtures/completed_build.json');
  bb = setupPollTest();
  bb.start();
  bb.on('new_build', function(build) {
    bb.stop();
    assert.equal(18529, build.number);
    scope.done();
    test.finish();
  });
}

exports['test_buildbot_builder_build'] = function(test, assert) {
  bb = setupPollTest();
  var revision = 'deadbeef';

  var body = 'username=philips&revision=deadbeef';
  var path = sprintf(bb._forceURL, 'Linux');
  var scope = nock(base_url)
                  .post(path, body)
                  .reply(201, 'OK');
  bb.build(revision, {name: 'philips'}, function(error, body) {
    scope.done();
    test.finish();
  });
}
