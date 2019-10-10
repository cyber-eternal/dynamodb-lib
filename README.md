# Dynamodb-lib


#### This library was created to simplify work with AWS Dynamodb using generalized functions.

## Installation

Use the package manager [npm](https://www.npmjs.com/) to install `dynamodb-lib`.

```bash
npm install dynamodb-lib
```
#### or 

```bash
npm i dynamodb-lib
```

## Usage

#### Set AWS configurations in environment variables:

```bash
export AWS_ACCESS_KEY_ID="Your AWS Access Key ID"
export AWS_SECRET_ACCESS_KEY="Your AWS Secret Access Key"
export AWS_REGION="us-east-1"
 ```

Here's a simple examples:

```node
import {
  getItemByGSI,
  getAllItemsByGSI,
  updateInDB,
  writeDataIntoDB,
  removeAttributes,
  deleteItems,
  deleteItem
} from dynamodb-lib;
```
## `getItemByGSI` => promise for returning Items from Dynamodb table using one query

### `getItemByGSI`can take following parameters:

`TableName` -  Name of you Dynamodb table: `required` type String

`IndexName` -  Name of you Index from Dynamodb table: `optional` type String

`attribute` -  Key for query: `required` type String

`value` -  Value for Key: `required` 

`sortKey` -  `optional` type String 

`sortValue` - Value for SortKey: `optional`

`filter` -  Filter for using in FilterExpression: `optional` type String

`filterValue` -  Value for Filter: `optional`

`operator` - Operator for Filters if you have more then 1 filter. Required if you have filter1 and filterValue1: `optional` type String

`filter1` -  Second Filter for using in FilterExpression: `optional` type String

`filterValue1` -  Value for Filter1: `optional`

`LastEvaluatedKey` - Use LastEvaluatedKey for get next items. You can get LastEvaluatedKey from first request if You have more items in Table for one query : `optional` type Object

`ScanIndexForward` - Use ScanIndexForward for ordering items. For sure items be ordered if you have sort Key. `ScanIndexForward: false` for Descending. By default its Ascending: `optional` type Boolean

`Limit` -  Use Limit for get Limited Items: `optional` type Number

## Here's a simple example:

```node
await getItemByGSI({
      TableName : 'Example',
      IndexName: 'favorite-createdAt-index',
      attribute: 'favorite',
      value: 'true',
      ScanIndexForward: false,
      Limit: 50
})
```

---

## `getAllItemsByGSI` => promise for returning all Items from Dynamodb table using recursive queries

### `getAllItemsByGSI`can take same parameters as `getItemByGSI`.

---

## `writeDataIntoDB` => promise for write record in  Dynamodb table

### `writeDataIntoDB`can take following parameters:

`TableName` -  Name of you Dynamodb table: `required` type String

`Item` -  Object for insert to Dynamodb table: `required` type Object

## Here's a simple example:

```node
await writeDataIntoDB({
      TableName : 'Example',
      Item: {
         id: '9474d4f5-546f-447b-bdd8-a9cc27315e3d ',
         name: 'John',
         gender: 'male'
      }

})
```

---

## `updateInDB` => promise for update record in  Dynamodb table

### `updateInDB`can take following parameters:

`TableName` -  Name of you Dynamodb table: `required` type String

`Key` -  Object with Primary Key and Sort key if its be added in tables default index : `required` type Object
`updatedData` -  Object with data for update(its can update nested objects data to). Primary key and sort key cant be updated: `required` type Object

## Here's a simple example:

```node
await updateInDB({
      TableName : 'Example',
      Key: {id: 1, date: '12/12/2019'}
      updatedData: {
         name: 'John',
         gender: 'male',
         skills: {
          programming: 'Good'
         }
      }

})
```

## Contributing
Pull requests are welcome. <br /> For major changes, please open an issue first to discuss what you would like to change.


## License
[GNU AGPL](https://www.gnu.org/licenses/)