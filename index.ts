"use strict";

var _ = require('lodash');
var AWS = require('aws-sdk');
var aws = new AWS;
var stage = process.env.STAGE;

var config = ({ region, accessKeyId, secretAccessKey }) => {
  try {
    return new aws.Config({
      accessKeyId, secretAccessKey, region
    });
  } catch (error) {
    return error
  }
};

var call = (action: string, params: Object) => {
  try {
    var dynamoDb = aws.DynamoDB.DocumentClient();
    return dynamoDb[action](params).promise();
  } catch (error) {
    return error
  }
};

var getItemByGSI = ({
  TableName,
  IndexName,
  attribute,
  value,
  sortKey,
  sortValue,
  filter,
  filterValue,
  operator,
  filter1,
  filterValue1,
  LastEvaluatedKey,
  ScanIndexForward,
  Limit
}) => {
  var params = {
    TableName: `${TableName}-${stage}`,
    IndexName,
    KeyConditionExpression: '#attrKey = :attrValue',
    ExpressionAttributeValues: { ':attrValue': value },
    ExpressionAttributeNames: { '#attrKey': attribute },
    ScanIndexForward,
    ExclusiveStartKey: LastEvaluatedKey,
    Limit,
    FilterExpression: null
  };
  sortKey && sortValue ? params.KeyConditionExpression += ' and #sortKey = :sortValue' &&
    (params.ExpressionAttributeNames['#sortKey'] = sortKey) &&
    (params.ExpressionAttributeValues[':sortKey'] = sortValue) : '';
  filter && filterValue ? (params.FilterExpression = `#${filter} = :${filter}`) &&
    (params.ExpressionAttributeNames[`#${filter}`] = filter) &&
    (params.ExpressionAttributeValues[`:${filter}`] = filterValue) : '';
  filter && filterValue && operator && filter1 && filterValue1 ? (params.FilterExpression += ` ${operator} #${filter1} = :${filter1}`) &&
    (params.ExpressionAttributeNames[`#${filter1}`] = filter1) &&
    (params.ExpressionAttributeValues[`:${filter1}`] = filterValue1) : '';
  params = _.omitBy(params, _.isNil)
  return call('query', params);
};

var writeDataIntoDB = (TableName: String, Item: Object) => {
  return new Promise(async (resolve, reject) => {
    try {
      var params = {
        TableName: `${TableName}-${stage}`,
        Item
      };
      await call('put', params);
      resolve('Success');
    } catch (error) {
      reject(error);
    }
  });
};

var getAllItemsByGSI = (data) => {
  return new Promise(async (resolve, reject) => {
    try {
      let finalData = [];
      let gettingData = await getItemByGSI(data);
      console.log('gettingData', gettingData);
      finalData = finalData.concat(gettingData.Items);
      if (gettingData.LastEvaluatedKey) {
        let final2 = await getAllItemsByGSI({ ...data, LastEvaluatedKey: gettingData.LastEvaluatedKey });
        finalData = finalData.concat(final2);
      }
      resolve(finalData);
    } catch (err) {
      reject(err);
    }
  });
};

var updateInDB = ({ TableName, Key, updatedData }) => {
  return new Promise(async (resolve, reject) => {
    try {
      console.log('updatedData', updatedData);
      var params = {
        TableName: `${TableName}-${stage}`,
        Key,
        UpdateExpression: 'SET #updatedAt = :updatedAt',
        ExpressionAttributeValues: {
          ':updatedAt': Date.now()
        },
        ExpressionAttributeNames: {
          '#updatedAt': 'updatedAt'
        },
      };
      _.forEach(updatedData, (item: any, key: any) => {
        if (key !== 'id' && key !== 'provider') {
          if (typeof item === 'string') {
            params.UpdateExpression += `, #${key} = :${key}`;
            params.ExpressionAttributeValues[`:${key}`] = item;
            params.ExpressionAttributeNames[`#${key}`] = key;
          } else if (typeof item === 'object' && Object.keys(item).length > 0) {
            _.forEach(item, (item1: any, key2: any) => {
              params.UpdateExpression += `, ${key}.#${key2} = :${key2}`;
              params.ExpressionAttributeValues[`:${key2}`] = item1;
              params.ExpressionAttributeNames[`#${key2}`] = key2;
            });
          }
        }
      });
      await call('update', params);
      resolve('Success');
    } catch (error) {
      reject(error);
    }
  });
};

// var deleteAttributes = ({ TableName, Key, attributesList }) => {
//   return new Promise(async (resolve, reject) => {
//     try {
//       let params = {
//         TableName: `${TableName}-${stage}`,
//         Key,
//       };
//       if (attributesList.length) {
//         params.UpdateExpression = '';
//         params.ExpressionAttributeNames = {};
//         let isFirst = true;
//         for (const attribute of attributesList) {
//           attribute !== attributesList[0] ? isFirst = false : '';
//           params.UpdateExpression += isFirst ? `#${attribute}` : `,#${attribute}`;
//           params.ExpressionAttributeNames[`#${attribute}`] = attribute;
//         }
//         console.log('params', params);
//         await dynamoDbLib.call('update', params);
//         console.log('Attributes successfully removed');
//         resolve('Attributes successfully removed');
//       } else {
//         console.log('Nothing to remove');
//         resolve('Nothing to remove');
//       }
//     } catch (error) {
//       console.log('ERROR in deleteAttributes', error);
//       reject(error);
//     }
//   });
// };

module.exports = {
  config,
  getItemByGSI,
  getAllItemsByGSI,
  updateInDB,
  writeDataIntoDB
};