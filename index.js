"use strict";

var omitBy = require('lodash/omitBy');
var isNil = require('lodash/isNil');
var forEach = require('lodash/forEach');
var AWS = require('aws-sdk');
var stage = process.env.STAGE;

var call = (action, params) => {
  return new Promise((resolve, reject) => {
    try {
      var dynamoDb = new AWS.DynamoDB.DocumentClient();
      resolve(dynamoDb[action](params).promise());
    } catch (error) {
      reject(error)
    }
  })
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
  return new Promise(async (resolve, reject) => {
    try {
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
      params = omitBy(params, isNil);
      var result = await call('query', params);
      resolve(result);
    } catch (error) {
      reject(error)
    }
  })
};

var writeDataIntoDB = (TableName, Item) => {
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
      // {
      //   TableName,
      //   IndexName,
      //   attribute,
      //   value,
      //   sortKey,
      //   sortValue,
      //   filter,
      //   filterValue,
      //   operator,
      //   filter1,
      //   filterValue1,
      //   LastEvaluatedKey,
      //   ScanIndexForward,
      //   Limit
      // }
      var finalData = [];
      var gettingData = await getItemByGSI(data);
      finalData = finalData.concat(gettingData.Items);
      if (gettingData.LastEvaluatedKey) {
        var final2 = await getAllItemsByGSI({ ...data, LastEvaluatedKey: gettingData.LastEvaluatedKey });
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
      forEach(updatedData, (item, key) => {
        if (key !== 'id' && key !== 'provider') {
          if (typeof item === 'string') {
            params.UpdateExpression += `, #${key} = :${key}`;
            params.ExpressionAttributeValues[`:${key}`] = item;
            params.ExpressionAttributeNames[`#${key}`] = key;
          } else if (typeof item === 'object' && Object.keys(item).length > 0) {
            forEach(item, (item1, key2) => {
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

var removeAttributes = ({ TableName, Key, attributesList }) => {
  return new Promise(async (resolve, reject) => {
    try {
      let params = {
        TableName: `${TableName}-${stage}`,
        Key,
      };
      if (attributesList.length) {
        params.UpdateExpression = 'REMOVE ';
        params.ExpressionAttributeNames = {};
        for (const attribute of attributesList) {
          var hasNext = attributesList[attributesList.indexOf(attribute) + 1] ? true : false
          params.UpdateExpression += hasNext ? `#${attribute}` : `, #${attribute}`;
          params.ExpressionAttributeNames[`#${attribute}`] = attribute;
        }
        await dynamoDbLib.call('update', params);
        resolve('Attributes successfully removed');
      } else {
        console.log('Nothing to remove');
        resolve('Nothing to remove');
      }
    } catch (error) {
      console.log('ERROR in deleteAttributes', error);
      reject(error);
    }
  });
};

var deleteItem = ({ TableName, Key }) => {
  return new Promise(async (resolve, reject) => {
    try {
      var params = {
        TableName,
        Key
      };
      await call('delete', params);
      resolve(`Item ${JSON.stringify(Key)} from ${TableName} successfully deleted`)
    } catch (e) {
      reject(e);
    }
  });
};

var deleteItems = ({ TableName, Keys }) => {
  return new Promise(async (resolve, reject) => {
    try {
      for (var x of Keys) {
        await deleteItem({ TableName, Key: x });
      }
      resolve(`Items successfully deleted`)
    } catch (e) {
      reject(e);
    }
  });
};

// var config = ({ region, accessKeyId, secretAccessKey }) => {
//   try {
//     return AWS.Config({
//       accessKeyId, secretAccessKey, region
//     });
//   } catch (error) {
//     return error
//   }
// };

module.exports = {
  // config,
  getItemByGSI,
  getAllItemsByGSI,
  updateInDB,
  writeDataIntoDB,
  removeAttributes,
  deleteItems,
  deleteItem
};