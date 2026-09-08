/** Local test adapter for the D1 subset used here. NOT a cloud D1 test.
 * Uses real SQLite transactions/constraints/triggers, not an in-memory fake store.
 */
import {DatabaseSync} from 'node:sqlite';
export class SQLiteD1 {
  constructor(path=':memory:') {this.sqlite=new DatabaseSync(path);this.sqlite.exec('PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL;');}
  prepare(sql){return new Statement(this,sql,[]);}
  async batch(statements){
    this.sqlite.exec('BEGIN IMMEDIATE');
    try{const result=statements.map(s=>s.execute());this.sqlite.exec('COMMIT');return result;}
    catch(e){this.sqlite.exec('ROLLBACK');throw e;}
  }
  exec(sql){this.sqlite.exec(sql);return Promise.resolve({count:1});}
  close(){this.sqlite.close();}
}
class Statement{
  constructor(db,sql,params){this.db=db;this.sql=sql;this.params=params;}
  bind(...params){return new Statement(this.db,this.sql,params);}
  async first(column){const r=this.db.sqlite.prepare(this.sql).get(...this.params);return r?(column?r[column]:r):null;}
  async all(){return {success:true,results:this.db.sqlite.prepare(this.sql).all(...this.params)};}
  execute(){const r=this.db.sqlite.prepare(this.sql).run(...this.params);return {success:true,results:[],meta:{changes:Number(r.changes)}};}
  async run(){return this.execute();}
}
