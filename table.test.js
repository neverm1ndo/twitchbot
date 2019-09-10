const Table = require('./lib/table.module.js');

let obj = { display_name: 'shroud',
  _id: '37402112',
  name: 'shroud',
  type: 'user',
  bio: 'Enjoy these highlights/vods, and remember to follow!',
  created_at: '2012-11-03T15:50:32.87847Z',
  updated_at: '2019-09-10T14:12:56.04474Z',
  }

  Table.build(obj)
