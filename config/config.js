/**
 * Created by cage on 2016/10/21.
 */
'use strict';
var config = {
    appName: 'dip new',
    domain: 'www.r7.com',
    email: {
        info: 'jetcage@163.com'
    },
    node: {
        host: 'localhost',
        port: '3001',
    },
    session: {
        secret: 'r7new_session159357',
        maxAge: 1200000 //默认20分钟
    },
    cookie: {
        secret: 'r7new_cookie159357'
    },
    secret_key: {
        key: 'a819709ff2d8c096166b1d8b',
        iv: 'a819709f'
    },
    table_name: {
        T_USER_MANAGER: 'T_USER_MANAGER',
        T_GRP_SEQ: 'T_GRP_SEQ',
        T_DIP_SEQ: 'T_DIP_SEQ',
        T_SVC_SEQ: 'T_SVC_SEQ',
        T_PROJECT_INFO: 'T_PROJECT_INFO',
        T_GROUP_INFO: 'T_GROUP_INFO',
        T_GROUP_PARAM: 'T_GROUP_PARAM',
        T_COMP_INFO: 'T_COMP_INFO',
        T_COMP_PARAM: 'T_COMP_PARAM',
        T_COMP_RELATION: 'T_COMP_RELATION',
        T_SERVICE_INFO: 'T_SERVICE_INFO',
        T_SERVICE_PARAM: 'T_SERVICE_PARAM',
        T_DB_FAV: 'T_DB_FAV',
        T_COMP_DEPEND_SETS: 'T_COMP_DEPEND_SETS',
        T_COMP_DB_OBJECT_SET: 'T_COMP_DB_OBJECT_SET',
        T_CAPTURE_RAC_INFO: 'T_CAPTURE_RAC_INFO',
        T_QUEUE_BPOINT: 'T_QUEUE_BPOINT',
        T_QUEUE_PKG: 'T_QUEUE_PKG',
        T_QUEUE_STATIS: 'T_QUEUE_STATIS',
        T_LDR_ERR_IDX: 'T_LDR_ERR_IDX',
        T_WEB_CACHE: 'T_WEB_CACHE',
        T_ETL_ADD_COLUMN: 'T_ETL_ADD_COLUMN',
        T_ETL_DELETE_COLUMN: 'T_ETL_DELETE_COLUMN',
        T_ETL_RECORD_FILTER: 'T_ETL_RECORD_FILTER',
        T_ETL_COLUMN_MAPPING: 'T_ETL_COLUMN_MAPPING',
        T_ETL_TABLE_AUDIT: 'T_ETL_TABLE_AUDIT',
        T_ETL_OPERATION_TRANSFORM: 'T_ETL_OPERATION_TRANSFORM',
        T_ETL_ASSIGN_DB_INFO: 'T_ETL_ASSIGN_DB_INFO',
        T_ETL_TABLE_FILTER: 'T_ETL_TABLE_FILTER',
        T_ETL_OPERATION_FILTER: 'T_ETL_OPERATION_FILTER',
        T_ETL_BATCH_RULES: 'T_ETL_BATCH_RULES',
        T_ETL_RULE_SET: 'T_ETL_RULE_SET',
        T_ETL_RULE_SET_DETAIL: 'T_ETL_RULE_SET_DETAIL',
        T_ETL_DELETE_TO_UPDATE_COLUMN: 'T_ETL_DELETE_TO_UPDATE_COLUMN',
        T_SYNC_EXPORT_PARAM: 'T_SYNC_EXPORT_PARAM',
        T_SYNC_IMPORT_PARAM: 'T_SYNC_IMPORT_PARAM',
        T_SYNC_SPECIFIED_TABLE: 'T_SYNC_SPECIFIED_TABLE',
        T_LDR_ERR_EXCLUDE_TAB: 'T_LDR_ERR_EXCLUDE_TAB'
    },
    type: {
        PROJECT: 'project',
        GROUP: 'group',
        COMPONENT: 'component',
        SYNC: 'sync'
    },
    service_type: {
        DIPSERVER: 'DIPSERVER',
        MANAGER: 'MANAGER',
        CRONTASK: 'CRONTASK',
        MONITOR: 'MONITOR',
        TSERVER: 'TSERVER',
        SENDER: 'SENDER'
    },
    service_pgm: {
        DIPSERVER: 'Dipserver',
        MANAGER: 'Dip_manager',
        CRONTASK: 'dip_crontask',
        MONITOR: 'dip_monitor',
        TSERVER: 'dip_tserver',
        SENDER: 'Dip_sender'
    },
    component_type: {
        DATABASE: 'database',
        CAPTURE: 'capture',
        QUEUE: 'queue',
        ETL: 'etl',
        APPLY: 'apply',
        TRANSFER: 'transfer',
        QSEND: 'qsend',
        QRECV: 'qrecv',
        MQPUBLISHER: 'mqpublisher'
    },
    component_type1: {
        DATABASE: 'DB',
        CAPTURE: 'ORA_CAPTURE',
        QUEUE: 'QUEUE',
        APPLY: 'ORA_LOADER',
        TRANSFER: 'TCLIENT'
    },
    capture: {
        ORACLE: {type: 'ORA_CAPTURE', program: 'dip_oracapture'},
        ORACLE_RAC: {type: 'ORA_PREADER', program: 'dip_orareader'},
        MYSQL: {type: 'MYSQL_CAPTURE', program: 'dip_mysqlcapture'},
        SQLSERVER: {type: 'MSS_CAPTURE', program: 'dip_msscapture'},
        DB297: {type: 'DB2_CAPTURE_V97', program: 'dip_db2v97capture'},
        DB295: {type: 'DB2_CAPTURE_V95', program: 'dip_db2v95capture'}
    },
    object_set_type: {
        SELECTED_USERS: 'selected_users',
        SNAPSHOT_TABLES: 'snapshot_tables',
        RAC_INFO: 'rac_info',
        ETL_ADD_COLUMN: 'add_column',
        ETL_DELETE_COLUMN: 'delete_column',
        ETL_RECORD_FILTER: 'record_filter',
        ETL_COLUMN_MAPPING: 'column_mapping',
        ETL_TABLE_AUDIT: 'table_audit',
        ETL_OPERATION_TRANSFORM: 'operation_transform',
        ETL_TABLE_FILTER: 'table_filter',
        ETL_OPERATION_FILTER: 'operation_filter',
        ETL_BATCH_FILTER: 'filter',
        ETL_BATCH_INSERT: 'insert',
        ETL_BATCH_UPDATE: 'update',
    },
    macro: {
        MAX_GROUP_OR_PROJECT: 64,
        DEFAULT_MANAGER_PORT: 7100,
        OLDR_ERROR_NOMATCH: -100,
        PAGE_BRANCHES_NUMBER: 10,

        /* direcotry */
        MN_DIR_ETC: 'etc',
        MN_DIR_DATA: 'data',
        MN_DIR_LOG: 'log',
        MN_DIR_DICT: 'dict',
        MN_DIR_SKIPSQL: 'skipsql',
        MN_DIR_ERRSQL: 'errsql',
        MN_DIR_SYNC: 'sync',


        /* error action definition */
        OLDR_ACT_USER_SKIP_RECORD: 1,
        OLDR_ACT_AUTO_SKIP_RECORD: 2,
        OLDR_ACT_FIXERR_SKIP_RECORD: 3, /* skip record because auto-fix error */
        OLDR_ACT_UNKNOWN_SKIP_RECORD: 4, /* skip record because unknown error */
        OLDR_ACT_USER_FIX_RECORD: 5,
        OLDR_ACT_AUTO_FIX_RECORD: 6,
        OLDR_ACT_USER_EXCLUDE_TABLE: 7,
        OLDR_ACT_AUTO_EXCLUDE_TABLE: 8,
        OLDR_ACT_FIXERR_EXCLUDE_TABLE: 9,
        OLDR_ACT_USER_FORCE_UPDATE: 10,

        /* database oparate type */
        DB_OP_INSERT: 101,
        DB_OP_UPDATE: 102,
        DB_OP_DELETE: 103,
        DB_OP_LOB_ERASE: 104,
        DB_OP_LOB_WRITE: 105,
        DB_OP_LOB_TRIM: 106,
        DB_OP_LOB_SELECT: 107,
        DB_OP_LONG_WRITE: 108,
        DB_OP_TAG_MARKER: 110,
        DB_OP_DDL: 200,
        DB_OP_SYNC_SEQUENCE: 201,
        DB_OP_START: 501,
        DB_OP_ROLLBACK: 503,
        DB_OP_COMMIT: 504,
        DB_OP_UNSUPPORT: 999,

        /* marked */
        OLDR_FLAG_MARKED: 1

    },
    db_type: ['oracle', 'sqlserver', 'db2', 'mysql', 'informix', 'sybase', 'altibase', 'postgresql', 'gbase_8a', 'oscar', 'dameng',
        'kingbase', 'vertica', 'dbone', 'kdb'],
    oracle_user: "'SYS','SYSTEM','MGMT_VIEW','DBSNMP','SYSMAN','SDE','OUTLN','MDSYS','WMSYS','FLOWS_FILES', 'ORDDATA','CTXSYS'," +
    "'ANONYMOUS','SI_INFORMTN_SCHEMA','ORDSYS','EXFSYS','APPQOSSYS','XDB','ORDPLUGINS','OWBSYS','OLAPSYS','XS$NULL'," +
    "'APEX_PUBLIC_USER','SPATIAL_CSW_ADMIN_USR','SPATIAL_WFS_ADMIN_USR'",
    DATABASE_2005: '2005',
    char_set_list: ['ZHS16GBK', 'ASCII', 'GB18030', 'BIG5', 'GB2312', 'UTF-8', 'UTF-16BE', 'UTF-16LE', 'UTF8', 'UTF16', 'GBK', 'US7ASCII', 'ZHT16BIG5', 'ZHS16CGB231280', 'AL32UTF8', 'AL16UTF16', 'AL16UTF16LE', 'WE8MSWIN1252', 'CP1252', 'UTF-16', 'UTF-32', 'UTF-7', 'UTF-32BE', 'UTF-32LE', 'UTF7', 'UTF32', 'UTF16BE', 'UTF16LE', 'UTF32BE', 'UTF32LE', 'UCS-2', 'UCS-2LE', 'UCS-2BE', 'UCS2'],
    PAGE_NUMS: '50'
};
module.exports = config;
