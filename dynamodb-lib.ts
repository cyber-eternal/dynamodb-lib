"use strict";

var AWS = require('aws-sdk');
var aws = new AWS;

var config = ({ region, accessKeyId, secretAccessKey }) => {
    return new aws.Config({
        accessKeyId, secretAccessKey, region
    });
};

var call = (action: string, params: Object) => {
    const dynamoDb = aws.DynamoDB.DocumentClient();
    return dynamoDb[action](params).promise();
};

module.exports = {
    config,
    call
};