const Promise = require('the-promise');
const _ = require('lodash');
const mysql = require('mysql2');
const events = require('events');

class MySqlDriver
{
    constructor(logger)
    {
        this._logger = logger;
        this._statementsSql = {};
        this._preparedStatements = {};
        this._connectEmitter = new events.EventEmitter();
    }

    get logger() {
        return this._logger;
    }

    connect()
    {
       return this._tryConnect();
    }

    onConnect(cb)
    {
        this._connectEmitter.on('connect', () => {
            cb(this);
        })
    }

    registerStatement(id, sql)
    {
        this._statementsSql[id] = sql;
    }

    executeStatement(id, params)
    {
        return new Promise((resolve, reject) => {
            this.logger.info("[executeStatement] executing: %s", id);
            var statement = this._preparedStatements[id];
            if (!statement) {
                reject("NOT PREPARED: " + id);
                return;
            }

            this.logger.info("[executeStatement] executing: %s", statement.constructor.name);

            if (!params) {
                params = [];
            }

            statement.execute(params, (err, results, fields) => {
                if (err) {
                    this.logger.error("[executeStatement] ", err);
                    reject(err);
                    return;
                }
                resolve(results);
            })
        })

    }

    /** IMPL **/

    _tryConnect()
    {
        try
        {
            if (this._isConnecting) {
                return;
            }
            this._isConnecting = true;
    
            var connection = mysql.createConnection({
                host     : 'localhost',
                user     : 'root',
                password : '',
                database : 'kubevious'
            });

            connection.on('error', (err) => {
                this.logger.error('[_tryConnect] ON ERROR: %s', err.code);
                this._disconnect();
            });
    
            connection.connect((err) => {
                this._isConnecting = false;
    
                if (err) {
                    // this.logger.error('[_tryConnect] CODE=%s', err.code);
                    // this._disconnect();
                    return;
                }
               
                this.logger.info('[_tryConnect] connected as id: %s', connection.threadId);
                this._acceptConnection(connection);
            });
        }
        catch(err)
        {
            this._isConnecting = false;
            this._disconnect();
        }
    }

    _disconnect()
    {
        this._connection = null;
        this._preparedStatements = {};
        this._tryReconnect();
    }

    _acceptConnection(connection)
    {
        this._connection = connection;

        return Promise.resolve()
            .then(() => this._prepareStatements())
            .then(() => {
                this._connectEmitter.emit('connect');
            })
            .catch(reason => {
                this.logger.error('[_acceptConnection] failed: ', reason);
                return this._disconnect();
            })
        ;
    }

    _prepareStatements()
    {
        return Promise.serial(_.keys(this._statementsSql), id => {
            var sql = this._statementsSql[id];
            return this._prepareStatementNow(id, sql)
                .then(statement => {
                    this._preparedStatements[id] = statement;
                });
        })
    }

    _prepareStatementNow(id, sql)
    {
        return new Promise((resolve, reject) => {
            this._connection.prepare(sql, (err, statement) => {
                if (err)
                {
                    this.logger.error('[_prepareStatementNow] failed to prepare %s. ', id, err);
                    reject(err);
                    return;
                }
                this.logger.info('[_prepareStatementNow] prepared: %s. inner id: %s', id, statement.id);
                resolve(statement);
            });
        });
    }

    _tryReconnect()
    {
        setTimeout(this._tryConnect.bind(this), 1000);
    }

}

module.exports = MySqlDriver;