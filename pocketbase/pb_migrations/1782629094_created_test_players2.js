/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = new Collection({
    "id": "ykp4yo6qbf4fyx9",
    "created": "2026-06-28 06:44:54.356Z",
    "updated": "2026-06-28 06:44:54.356Z",
    "name": "test_players2",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "hyh9kxki",
        "name": "user",
        "type": "relation",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "collectionId": "_pb_users_auth_",
          "cascadeDelete": true,
          "minSelect": 1,
          "maxSelect": 1,
          "displayFields": null
        }
      }
    ],
    "indexes": [],
    "listRule": null,
    "viewRule": null,
    "createRule": null,
    "updateRule": null,
    "deleteRule": null,
    "options": {}
  });

  return Dao(db).saveCollection(collection);
}, (db) => {
  const dao = new Dao(db);
  const collection = dao.findCollectionByNameOrId("ykp4yo6qbf4fyx9");

  return dao.deleteCollection(collection);
})
