drop table if exists T_COMP_INFO;

drop table if exists T_COMP_PARAM;

drop table if exists T_COMP_RELATION;

drop table if exists T_COMP_DB_OBJECT_SET;

drop table if exists T_DIP_MONITOR;

drop table if exists T_DIP_MACHINE;

drop table if exists T_DB_FAV;

drop table if exists T_GROUP_INFO;

drop table if exists T_GROUP_PARAM;

drop table if exists T_JOB_INFO;

drop table if exists T_JOB_OPTLOG;

drop table if exists T_LDR_ERR_IDX;

drop table if exists T_WEB_CACHE;

drop table if exists T_COMP_DEPEND_SETS;

drop table if exists T_PROJECT_INFO;

drop table if exists T_QUEUE_BPOINT;

drop table if exists T_QUEUE_PKG;

drop table if exists T_QUEUE_STATIS;

drop table if exists T_CAPTURE_RAC_INFO;

drop table if exists T_SERVICE_INFO;

drop table if exists T_SERVICE_PARAM;

drop table if exists T_USER_MANAGER;


/*==============================================================*/
/* Table: T_COMP_INFO                                           */
/*==============================================================*/
create table T_COMP_INFO
(
   ID                   varchar(32) not null,
   NAME                 varchar(32),
   TYPE                 varchar(32),
   PROGRAM              varchar(32),
   PRE_ID               varchar(255),
   SUF_ID               varchar(255),
   GROUP_ID             varchar(32),
   CREATE_TIME          datetime,
   REMARK               varchar(255),
   primary key (ID)
);

/*==============================================================*/
/* Table: T_COMP_PARAM                                          */
/*==============================================================*/
create table T_COMP_PARAM
(
   COMP_ID              varchar(32),
   PARAM_NAME           varchar(32),
   PARAM_VALUE          varchar(255),
   PARAM_TYPE           varchar(32),
   VALID                varchar(16),
   INSERT_TIME          datetime,
   UPDATE_TIME          datetime,
   REMARK               varchar(255)
);

/*==============================================================*/
/* Table: T_COMP_RELATION                                       */
/*==============================================================*/
create table T_COMP_RELATION
(
   GROUP_ID             varchar(32),
   IDX                  varchar(32),
   LINE                 varchar(65536),
   CONTENT              varchar(65536)
);

/*==============================================================*/
/* Table: T_COMP_DB_OBJECT_SET                                       */
/*==============================================================*/
create table T_COMP_DB_OBJECT_SET
(
   SET_ID               int,
   SCHEMA_NAME          varchar(128),
   MAP_SCHEMA_NAME      varchar(128),
   OBJECT_TYPE          varchar(128),
   OBJECT_NAME          varchar(128),
   MAP_OBJECT           varchar(128)
);

drop table if exists T_COMP_CLASS;
create table T_COMP_CLASS
(
	CLASS_NAME		varchar(128),
	COMP_TYPE		varchar(128)
);

/*==============================================================*/
/* Table: T_DIP_MONITOR                                        */
/*==============================================================*/
create table T_DIP_MONITOR
(
   ID                   int,
   PROJ_ID              varchar(32),
   GROUP_ID           	varchar(32),
   COMP_ID           	varchar(32),
   COMP_FLAG			int,
   COMP_TYPE            varchar(32),
   DB_NAME              varchar(32),
   COMP_STATUS          int,
   COMP_STATUS_DESC     varchar(32),
   ERR_CODE				int,
   ERR_CODE_DESC		varchar(255),
   DEAL_SCT				datetime,
   DEAL_SCN				varchar(64),
   START_TIME           varchar(32),
   ONLINE               int,
   LAST_INSERT_NUM      bigint(20),
   LAST_UPDATE_NUM      bigint(20),
   LAST_DELETE_NUM      bigint(20),
   LAST_DDL_NUM         bigint(20),
   CUR_INSERT_NUM       bigint(20),
   CUR_UPDATE_NUM       bigint(20),
   CUR_DELETE_NUM       bigint(20),
   CUR_DDL_NUM          bigint(20),
   DELAY				int,
   THROUGHPUT           double,
   MONITOR_INTERVAL     int,
   LAST_UPDATE_TIME		datetime
);


/*==============================================================*/
/* Table: T_DIP_MACHINE                                         */
/*==============================================================*/
create table T_DIP_MACHINE
(
   ID                   int not null auto_increment,
   IP                   varchar(32),
   MECHINE_NAME         varchar(128),
   OS_NAME              varchar(128),
   CPU_USAGE            double,
   MEM_TOTAL            double,
   MEM_USED             double,
   DISK_TOTAL           double,
   DISK_USED            double,
   DISK_IO              double,
   NETWORK_RECV         double,
   NETWORK_SEND         double,
   CUR_TIME             varchar(32),
   primary key (ID)
);

/*==============================================================*/
/* Table: T_DB_FAV                                              */
/*==============================================================*/
create table T_DB_FAV
(
   DB_NAME              varchar(128),
   DB_TYPE              varchar(32),
   DB_IP                varchar(64),
   DB_PORT              varchar(64),
   DB_USER              varchar(128),
   DB_PASSWORD          varchar(128),
   DB_ID                varchar(64),
   AS_SOURCE_DB         varchar(64)
);

/*==============================================================*/
/* Table: T_GROUP_INFO                                          */
/*==============================================================*/
create table T_GROUP_INFO
(
   ID                   varchar(32) not null,
   PROJECT_ID           varchar(32) not null,
   NAME                 varchar(32),
   CREATE_TIME          datetime,
   REMARK               varchar(255),
   primary key (ID)
);

/*==============================================================*/
/* Table: T_GROUP_PARAM                                         */
/*==============================================================*/
create table T_GROUP_PARAM
(
   GROUP_ID             varchar(32) not null,
   PARAM_NAME           varchar(32),
   PARAM_VALUE          varchar(255),
   VALID                varchar(16),
   INSERT_TIME          datetime,
   UPDATE_TIME          datetime,
   REMARK               varchar(255)
);

/*==============================================================*/
/* Table: T_JOB_INFO                                            */
/*==============================================================*/
create table T_JOB_INFO
(
   ID                   int not null auto_increment,
   NAME                 varchar(512) not null,
   INTERVALSTR          varchar(512) not null,
   CMD                  varchar(512) not null,
   ISENABLE             int not null,
   primary key (ID)
);

/*==============================================================*/
/* Table: T_JOB_OPTLOG                                          */
/*==============================================================*/
create table T_JOB_OPTLOG
(
   ID                   int not null auto_increment,
   NAME                 varchar(512) not null,
   OPT                  int not null,
   TIME                 char(20) not null,
   OPTRESULT            int not null,
   MSG                  varchar(2048),
   primary key (ID)
);

/*==============================================================*/
/* Table: T_LDR_ERR_IDX                                         */
/*==============================================================*/
create table T_LDR_ERR_IDX
(
   GROUP_ID             varchar(32),
   COMP_ID              varchar(32),
   FLAG                 varchar(32),
   ACTION               varchar(32),
   OPTCODE              varchar(32),
   LEN                  int,
   UPDATE_TIME          datetime,
   ERRCODE              varchar(32),
   OFFSET               bigint,
   OWNER                varchar(32),
   TNAME                varchar(32)
);

/*==============================================================*/
/* Table: T_WEB_CACHE                                      */
/*==============================================================*/
create table T_WEB_CACHE
(
   COMP_ID            varchar(256),
   CACHE              varchar(65536)
);

/*==============================================================*/
/* Table: T_COMP_DEPEND_SETS                                          */
/*==============================================================*/
create table T_COMP_DEPEND_SETS
(
   ID                   int not null auto_increment,
   NAME                 varchar(32),
   TYPE                 varchar(32),
   TABLE_NAME           varchar(128),
   CREATE_TIME          datetime,
   REMARK               varchar(255),
   primary key (ID)
);

/*==============================================================*/
/* Table: T_PROJECT_INFO                                        */
/*==============================================================*/
create table T_PROJECT_INFO
(
   ID                   varchar(32) not null,
   NAME                 varchar(32),
   CREATE_TIME          datetime,
   REMARK               varchar(255),
   primary key (ID)
);

/*==============================================================*/
/* Table: T_QUEUE_BPOINT                                        */
/*==============================================================*/
create table T_QUEUE_BPOINT
(
   NUM                  bigint(20),
   ID                   bigint(20),
   NAME                 national varchar(32) not null,
   QNO                  int(11),
   OFT                  bigint(20),
   QUEUE_ID             varchar(32) not null default '0',
   primary key (NAME, QUEUE_ID)
);

/*==============================================================*/
/* Table: T_QUEUE_PKG                                           */
/*==============================================================*/
create table T_QUEUE_PKG
(
   ID                   bigint(20) not null auto_increment,
   XID                  varchar(32),
   CTIME                datetime,
   CSCN                 varchar(32),
   NREC                 int(11),
   QUEUE_ID             varchar(32),
   QNO                  int(11),
   OFT                  bigint(20),
   primary key (ID)
);

/*==============================================================*/
/* Table: T_QUEUE_STATIS                                        */
/*==============================================================*/
create table T_QUEUE_STATIS
(
   ID                   bigint(20) not null auto_increment,
   OWNER                national varchar(32),
   ONAM                 national varchar(64),
   INSNUM               bigint(20) default 0,
   UPDNUM               bigint(20) default 0,
   DELNUM               bigint(20) default 0,
   DDLNUM               bigint(20) default 0,
   CTIME                datetime,
   LOBNUM               bigint(20) default 0,
   ALLLENTH             bigint(20) default 0,
   QUEUE_ID             varchar(32),
   primary key (ID)
);

/*==============================================================*/
/* Table: T_CAPTURE_RAC_INFO                                            */
/*==============================================================*/
create table T_CAPTURE_RAC_INFO
(
   SET_ID               int,
   THREAD               int,
   NAME                 varchar(32),
   IP                   varchar(255),
   PORT                 int,
   ENABLE               varchar(32),
   PATH                 varchar(4096)
);

/*==============================================================*/
/* Table: T_SERVICE_INFO                                        */
/*==============================================================*/
create table T_SERVICE_INFO
(
   ID                   varchar(32) not null,
   SERVICE_NAME         varchar(32),
   TYPE                 varchar(32),
   PROGRAM              varchar(32),
   REMARK               varchar(255),
   primary key (ID)
);

/*==============================================================*/
/* Table: T_SERVICE_PARAM                                       */
/*==============================================================*/
create table T_SERVICE_PARAM
(
   SERVICE_ID           varchar(32) not null,
   PARAM_NAME           varchar(32),
   PARAM_VALUE          varchar(255),
   VALID                varchar(16),
   INSERT_TIME          datetime,
   UPDATE_TIME          datetime,
   REMARK               varchar(255)
);

/*==============================================================*/
/* Table: T_USER_MANAGER                                        */
/*==============================================================*/
create table T_USER_MANAGER
(
   USER_NAME            varchar(255) not null,
   USER_PWD             varchar(255),
   USER_AUTH            varchar(255),
   CREATE_TIME          datetime,
   FOUNDER              varchar(255),
   primary key (USER_NAME)
);

/*20170406*/
/*==============================================================*/
/* Table: T_DIP_SEQ                                       */
/*==============================================================*/
drop table if exists T_DIP_SEQ;
create table T_DIP_SEQ
(
  SEQ_TYPE 							varchar(32) NOT NULL,
  CURRENT_VALUE 				bigint(255)
);

/*==============================================================*/
/* Table: T_ETL_ADD_COLUMN                                       */
/*==============================================================*/
drop table if exists T_ETL_ADD_COLUMN;
create table T_ETL_ADD_COLUMN
(
  SET_ID 								int(11),
  RULE_TYPE 						varchar(32),
  OBJECT 								varchar(256),
  COLUMN_NAME 					varchar(128),
  DATA_TYPE 						varchar(32),
  COLUMN_SOURCE 				varchar(64),
  COLUMN_VALUE 					varchar(1024),
  SQL_EXPRESSION 				varchar(2048),
  CONNECT_DB 						varchar(8),
  DBNAME 								varchar(128),
  BIND_NAME 						varchar(128)
);

/*==============================================================*/
/* Table: T_ETL_ASSIGN_DB_INFO                                       */
/*==============================================================*/
drop table if exists T_ETL_ASSIGN_DB_INFO;
create table T_ETL_ASSIGN_DB_INFO
(
  DB_NAME 							varchar(128),
  DB_TYPE 							varchar(32),
  DB_IP 								varchar(64),
  DB_PORT 							varchar(64),
  DB_USER 							varchar(128),
  DB_PASSWORD 					varchar(128),
  DB_ID 								varchar(64),
  DB_CONNECT_MODE 			varchar(8),
  DB_CONNECT_STRING 		varchar(64),
  ENCRYPT_PASSWORD 			varchar(8)
);

/*==============================================================*/
/* Table: T_ETL_BATCH_RULES                                       */
/*==============================================================*/
drop table if exists T_ETL_BATCH_RULES;
create table T_ETL_BATCH_RULES
(
  SET_ID 								int(11),
  RULE_SET_TYPE 				varchar(64),
  RULE_SET_NAME 				varchar(128),
  CODER 								varchar(128),
  VALUE 								varchar(256)
);

/*==============================================================*/
/* Table: T_ETL_COLUMN_MAPPING                                       */
/*==============================================================*/
drop table if exists T_ETL_COLUMN_MAPPING;
create table T_ETL_COLUMN_MAPPING
(
  SET_ID 								int(11),
  RULE_TYPE 						varchar(32),
  OBJECT 								varchar(256),
  COLUMN_NAME 					varchar(256),
  COLUMN_TYPE 					varchar(32),
  MAPPING_NAME 					varchar(256),
  MAPPING_TYPE 					varchar(32),
  ORGL_EXPRESSION 			varchar(1024),
  SQL_EXPRESSION 				varchar(1024),
  CONNECT_DB 						varchar(8),
  DBNAME 								varchar(128),
  BIND_NAME 						varchar(1024)
);

/*==============================================================*/
/* Table: T_ETL_DELETE_COLUMN                                       */
/*==============================================================*/
drop table if exists T_ETL_DELETE_COLUMN;
create table T_ETL_DELETE_COLUMN
(
  SET_ID 								int(11),
  RULE_TYPE							varchar(32),
  OBJECT 								varchar(256),
  COLUMN_NAME 					varchar(256),
  COLUMN_TYPE 					varchar(32)
);

/*==============================================================*/
/* Table: T_ETL_OPERATION_FILTER                                       */
/*==============================================================*/
drop table if exists T_ETL_OPERATION_FILTER;
create table T_ETL_OPERATION_FILTER
(
  SET_ID 								int(11),
  RULE_TYPE 						varchar(32),
  OBJECT 								varchar(256),
  TABLE_NAME 						varchar(128),
  ORGL_EXPRESSION 			varchar(2048),
  SQL_EXPRESSION 				varchar(2048),
  CONNECT_DB 						varchar(8),
  DBNAME 								varchar(128),
  BIND_NAME 						varchar(1024),
  INSERT_FLAG 					varchar(16),
  DELETE_FLAG 					varchar(16),
  UPDATE_FLAG 					varchar(16)
);

/*==============================================================*/
/* Table: T_ETL_OPERATION_TRANSFORM                                       */
/*==============================================================*/
drop table if exists T_ETL_OPERATION_TRANSFORM;
create table T_ETL_OPERATION_TRANSFORM
(
  SET_ID 								int(11),
  RULE_TYPE 						varchar(32),
  OBJECT 								varchar(256),
  ORGL_EXPRESSION 			varchar(2048),
  SQL_EXPRESSION 				varchar(2048),
  OPTION1 							varchar(8),
  CONNECT_DB 						varchar(8),
  DBNAME 								varchar(128),
  BIND_NAME 						varchar(1024)
);

/*==============================================================*/
/* Table: T_ETL_RECORD_FILTER                                       */
/*==============================================================*/
drop table if exists T_ETL_RECORD_FILTER;
create table T_ETL_RECORD_FILTER
(
  SET_ID 								int(11),
  RULE_TYPE 						varchar(32),
  OBJECT 								varchar(256),
  ORGL_EXPRESSION 			varchar(2048),
  SQL_EXPRESSION 				varchar(2048),
  OPTION1 							varchar(8),
  CONNECT_DB 						varchar(8),
  DBNAME 								varchar(128),
  BIND_NAME 						varchar(1024)
);

/*==============================================================*/
/* Table: T_ETL_RULE_SET                                       */
/*==============================================================*/
drop table if exists T_ETL_RULE_SET;
create table T_ETL_RULE_SET
(
  ID 					int(11),
  GROUP_ID 				varchar(32),
  RULE_SET_NAME 			varchar(128),
  RULE_SET_TYPE 			varchar(64)
);

/*==============================================================*/
/* Table: T_ETL_RULE_SET_DETAIL                                       */
/*==============================================================*/
drop table if exists T_ETL_RULE_SET_DETAIL;
create table T_ETL_RULE_SET_DETAIL
(
  GROUP_ID 							varchar(32),
  RULE_SET_TYPE					varchar(32),
  RULE_SET_NAME 				varchar(128),
  OBJNAME 							varchar(256),
  RULE_ID 							varchar(32),
  CONNECTDB 						varchar(8),
  DBNAME 								varchar(128),
  OPTIONS 							varchar(8),
  SQLEXP 								varchar(2048),
  ORIEXP 								varchar(2048),
  BINDVAR 							varchar(256),
  REPVALUE 							varchar(256)
);

/*==============================================================*/
/* Table: T_ETL_TABLE_AUDIT                                       */
/*==============================================================*/
drop table if exists T_ETL_TABLE_AUDIT;
create table T_ETL_TABLE_AUDIT
(
  SET_ID 								int(11),
  RULE_TYPE 						varchar(32),
  OBJECT 								varchar(256),
  TABLE_PREFIX 					varchar(256),
  TABLE_SUFFIX 					varchar(256),
  KEEP_COPY 						varchar(16),
  COLUMN_NAME 					varchar(128),
  DATA_TYPE 						varchar(32),
  COLUMN_SOURCE 				varchar(32),
  COLUMN_VALUE 					varchar(256)
);

/*==============================================================*/
/* Table: T_ETL_TABLE_FILTER                                       */
/*==============================================================*/
drop table if exists T_ETL_TABLE_FILTER;
create table T_ETL_TABLE_FILTER
(
  SET_ID 								int(11),
  RULE_TYPE 						varchar(32),
  OBJECT 								varchar(256),
  CLUDE 								varchar(32),
  TABLE_NAME 						varchar(128)
);

/*==============================================================*/
/* Table: BATCH_RULES_REFRESH_ETL                               */
/*==============================================================*/
drop table if exists BATCH_RULES_REFRESH_ETL;
create table BATCH_RULES_REFRESH_ETL
(
  RULETABLE  						VARCHAR(32) not null,
  RULETYPE 							VARCHAR(64),
  ETLNAME 							VARCHAR(64),
  FLAG 								int(11)
);

/*==============================================================*/
/* Table: T_ETL_DELETE_TO_UPDATE_COLUMN                         */
/*==============================================================*/
DROP TABLE IF EXISTS `T_ETL_DELETE_TO_UPDATE_COLUMN`;
CREATE TABLE `T_ETL_DELETE_TO_UPDATE_COLUMN` (
  `SET_ID` INT(11) DEFAULT NULL,
  `RESERVE_ALL` VARCHAR(32) DEFAULT NULL,
  `OBJECT` VARCHAR(256) DEFAULT NULL,
  `COLUMN_NAME` VARCHAR(128) DEFAULT NULL,
  `COLUMN_TYPE` VARCHAR(32) DEFAULT NULL
) ENGINE=INNODB DEFAULT CHARSET=utf8;

/*==============================================================*/
/* Table: T_SYNC_EXPORT_PARAM                                   */
/*==============================================================*/
DROP TABLE IF EXISTS `T_SYNC_EXPORT_PARAM`;
CREATE TABLE `T_SYNC_EXPORT_PARAM` (
  `SET_ID` int(11) NOT NULL,
  `GROUP_ID` varchar(32) NOT NULL DEFAULT '',
  `LOADER_ID` varchar(32) NOT NULL DEFAULT '',
  `EXP_DICT_ONLY` int(255) NOT NULL DEFAULT '0',
  `EXP_STRING` int(255) NOT NULL DEFAULT '0',
  `EXP_MODE` int(255) NOT NULL DEFAULT '1' COMMENT 'EXPORT MODE , 1 IS FULL, 0 IS PART',
  `EXP_SCN` bigint(255) NOT NULL DEFAULT '0',
  `EXP_NLS_LANG` varchar(255) NOT NULL DEFAULT '',
  `EXP_USE_ETL` int(255) NOT NULL DEFAULT '0',
  `EXP_NUM` int(11) NOT NULL DEFAULT '1',
  `EXP_CREATE_TABLE` int(255) NOT NULL DEFAULT '1',
  `EXP_CREATE_INDEX` int(255) NOT NULL DEFAULT '1',
  `EXP_CREATE_OBJECT` int(255) NOT NULL DEFAULT '0',
  `EXP_PARALLEL_NUM` int(11) NOT NULL DEFAULT '0',
  `FILE_SIZE` int(11) NOT NULL DEFAULT '32',
  `EXP_PARAM_CTIME` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `EXP_USE_SOURCE_TBS` int(255) NOT NULL DEFAULT '0',
PRIMARY KEY (`SET_ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

/*==============================================================*/
/* Table: T_SYNC_IMPORT_PARAM                                   */
/*==============================================================*/
DROP TABLE IF EXISTS `T_SYNC_IMPORT_PARAM`;
CREATE TABLE `T_SYNC_IMPORT_PARAM` (
  `SET_ID` int(11) NOT NULL,
  `GROUP_ID` varchar(32) NOT NULL DEFAULT '',
  `LOADER_ID` varchar(32) NOT NULL DEFAULT '',
  `IMP_MMAP_ID` int(11) NOT NULL,
  `IMP_MODE` int(255) NOT NULL DEFAULT '1' COMMENT 'IMPORT MODE, 1 IS FULL, 2 IS PART',
  `IMP_NUM` int(11) NOT NULL DEFAULT '0',
  `IMP_PARALLEL_NUM` int(255) NOT NULL DEFAULT '0',
  `IMP_DICT_ONLY` int(11) NOT NULL DEFAULT '0',
  `IMP_WRITE_LOG` int(255) NOT NULL DEFAULT '0',
  `IMP_REBUILD_TABLE` int(255) NOT NULL DEFAULT '1',
  `IMP_TRUNCATE_TABLE` int(255) NOT NULL DEFAULT '1',
  `IMP_REBUILD_INDEX` int(255) NOT NULL DEFAULT '1',
  `IMP_REBUILD_OBJECT` int(255) NOT NULL DEFAULT '0',
  `IMP_NLS_LANG` varchar(255) NOT NULL DEFAULT '',
  `IMP_BACKUP_FILE` int(255) NOT NULL DEFAULT '1',
  `IMP_PARAM_CTIME` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00' ON UPDATE CURRENT_TIMESTAMP,
  `IMP_ORA_DP` int(255) NOT NULL DEFAULT '0',
  `IMP_USE_TBS_MAP` int(255) NOT NULL DEFAULT '0',
  PRIMARY KEY (`SET_ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

/*==============================================================*/
/* Table: T_SYNC_SPECIFIED_TABLE                                */
/*==============================================================*/
DROP TABLE IF EXISTS `T_SYNC_SPECIFIED_TABLE`;
CREATE TABLE `T_SYNC_SPECIFIED_TABLE` (
  `SET_ID` int(11) DEFAULT NULL,
  `SCHEMA_NAME` varchar(128) DEFAULT NULL,
  `MAP_SCHEMA_NAME` varchar(128) DEFAULT NULL,
  `OBJECT_TYPE` varchar(128) DEFAULT NULL,
  `OBJECT_NAME` varchar(128) DEFAULT NULL,
  `MAP_OBJECT` varchar(128) DEFAULT NULL,
  `SYNC_TYPE` int(11) DEFAULT NULL,
  `COND` varchar(1024) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

/*==============================================================*/
/* Table: T_LDR_ERR_EXCLUDE_TAB                                 */
/*==============================================================*/
DROP TABLE IF EXISTS `T_LDR_ERR_EXCLUDE_TAB`;
CREATE TABLE `T_LDR_ERR_EXCLUDE_TAB` (
  `GROUP_ID` varchar(32) NOT NULL,
  `COMP_ID` varchar(32) NOT NULL,
  `SCHEMA_NAME` varchar(128) NOT NULL,
  `MAP_SCHEMA` varchar(128) DEFAULT NULL,
  `TABLE_NAME` varchar(128) NOT NULL,
  `MAP_TABLE` varchar(128) DEFAULT NULL,
  `ERR_MESSAGE` varchar(8000) DEFAULT NULL,
  `EXCLUDE_TIME` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

/*==============================================================*/
/* Table: T_AUTH_SESSIONS                                       */
/*==============================================================*/
DROP TABLE IF EXISTS `T_AUTH_SESSIONS`;

CREATE TABLE `T_AUTH_SESSIONS` (
  `session_id` varchar(128) NOT NULL,
  `expires` int(11) unsigned NOT NULL,
  `data` text CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
   PRIMARY KEY (`session_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

insert into T_USER_MANAGER values ('admin', '628zqOdd1dY=', 'super_admin', '2017-01-19', '');

insert into T_SERVICE_INFO(ID,SERVICE_NAME,TYPE,PROGRAM) values('service_1', 'dipserver', 'DIPSERVER', 'dipserver');
insert into T_SERVICE_INFO(ID,SERVICE_NAME,TYPE,PROGRAM) values('service_2', 'dip_manager', 'MANAGER', 'dip_manager');
insert into T_SERVICE_INFO(ID,SERVICE_NAME,TYPE,PROGRAM) values('service_3', 'dip_crontask', 'CRONTASK', 'dip_crontask');
insert into T_SERVICE_INFO(ID,SERVICE_NAME,TYPE,PROGRAM) values('service_4', 'dip_monitor', 'MONITOR', 'dip_monitor');
insert into T_SERVICE_INFO(ID,SERVICE_NAME,TYPE,PROGRAM) values('service_5', 'dip_tserver', 'TSERVER', 'dip_tserver');
insert into T_SERVICE_INFO(ID,SERVICE_NAME,TYPE,PROGRAM) values('service_6', 'dip_sender', 'SENDER', 'dip_sender');

insert into T_SERVICE_PARAM(SERVICE_ID,PARAM_NAME,PARAM_VALUE,VALID,INSERT_TIME,UPDATE_TIME) values('service_1', 'log_reserved_hour', '24', 'YES', '2017-01-11 10:10:10', '2017-01-11 10:10:10');
insert into T_SERVICE_PARAM(SERVICE_ID,PARAM_NAME,PARAM_VALUE,VALID,INSERT_TIME,UPDATE_TIME) values('service_3', 'update_job_interval', '300', 'YES', '2017-01-11 10:10:10', '2017-01-11 10:10:10');

insert into T_SERVICE_PARAM(SERVICE_ID,PARAM_NAME,PARAM_VALUE,VALID,INSERT_TIME,UPDATE_TIME) values('service_4', 'monitor_disk_name', 'sda', 'YES', '2017-01-11 10:10:10', '2017-01-11 10:10:10');
insert into T_SERVICE_PARAM(SERVICE_ID,PARAM_NAME,PARAM_VALUE,VALID,INSERT_TIME,UPDATE_TIME) values('service_4', 'update_interval', '300', 'YES', '2017-01-11 10:10:10', '2017-01-11 10:10:10');

/*
insert into T_SERVICE_PARAM(SERVICE_ID,PARAM_NAME,PARAM_VALUE,VALID,INSERT_TIME,UPDATE_TIME) values('service_4', 'task_identify', 'test1', 'YES', '2017-01-11 10:10:10', '2017-01-11 10:10:10');
insert into T_SERVICE_PARAM(SERVICE_ID,PARAM_NAME,PARAM_VALUE,VALID,INSERT_TIME,UPDATE_TIME) values('service_4', 'monitor_ip', '127.0.0.1', 'YES', '2017-01-11 10:10:10', '2017-01-11 10:10:10');
insert into T_SERVICE_PARAM(SERVICE_ID,PARAM_NAME,PARAM_VALUE,VALID,INSERT_TIME,UPDATE_TIME) values('service_4', 'monitor_port', '1234', 'YES', '2017-01-11 10:10:10', '2017-01-11 10:10:10');
*/
insert into T_SERVICE_PARAM(SERVICE_ID,PARAM_NAME,PARAM_VALUE,VALID,INSERT_TIME,UPDATE_TIME) values('service_4', 'monitor_interval', '30', 'YES', '2017-01-11 10:10:10', '2017-01-11 10:10:10');
insert into T_SERVICE_PARAM(SERVICE_ID,PARAM_NAME,PARAM_VALUE,VALID,INSERT_TIME,UPDATE_TIME) values('service_4', 'check_interval', '1', 'YES', '2017-01-11 10:10:10', '2017-01-11 10:10:10');
insert into T_SERVICE_PARAM(SERVICE_ID,PARAM_NAME,PARAM_VALUE,VALID,INSERT_TIME,UPDATE_TIME) values('service_4', 'free_disk_threshold', '20', 'YES', '2017-01-11 10:10:10', '2017-01-11 10:10:10');
insert into T_SERVICE_PARAM(SERVICE_ID,PARAM_NAME,PARAM_VALUE,VALID,INSERT_TIME,UPDATE_TIME) values('service_4', 'unmonitored_group', '', 'YES', '2017-01-11 10:10:10', '2017-01-11 10:10:10');

insert into T_JOB_INFO(NAME,INTERVALSTR,CMD,ISENABLE) values('queue_statis', '*/5 * * * *', '$DIP_HOME/bin/dip_job_queue_statis', 1);
insert into T_JOB_INFO(NAME,INTERVALSTR,CMD,ISENABLE) values('delete_log', '*/5 * * * *', '$DIP_HOME/bin/dip_job_delete_log', 1);
insert into T_JOB_INFO(NAME,INTERVALSTR,CMD,ISENABLE) values('loader_idx2db', '*/5 * * * *', '$DIP_HOME/bin/dip_job_ldr_idx2db', 1);

/*20170406*/
insert into T_DIP_SEQ(SEQ_TYPE, CURRENT_VALUE) values('COMP_SEQ', 1);
insert into T_DIP_SEQ(SEQ_TYPE, CURRENT_VALUE) values('DIP_MONITOR', 1);
insert into T_DIP_SEQ(SEQ_TYPE, CURRENT_VALUE) values('GROUP_SEQ', 1);
insert into T_DIP_SEQ(SEQ_TYPE, CURRENT_VALUE) values('PROJECT_SEQ', 1);
insert into T_DIP_SEQ(SEQ_TYPE, CURRENT_VALUE) values('SYNC_SEQ', 1);


insert into T_COMP_CLASS(CLASS_NAME, COMP_TYPE) values('CAPTURE', 'ORA_CAPTURE');
insert into T_COMP_CLASS(CLASS_NAME, COMP_TYPE) values('CAPTURE', 'ORA_PREADER');
insert into T_COMP_CLASS(CLASS_NAME, COMP_TYPE) values('CAPTURE', 'MYSQL_CAPTURE');
insert into T_COMP_CLASS(CLASS_NAME, COMP_TYPE) values('CAPTURE', 'MSS_CAPTURE');
insert into T_COMP_CLASS(CLASS_NAME, COMP_TYPE) values('CAPTURE', 'DB2_CAPTURE_V97');
insert into T_COMP_CLASS(CLASS_NAME, COMP_TYPE) values('CAPTURE', 'DB2_CAPTURE_V95');
insert into T_COMP_CLASS(CLASS_NAME, COMP_TYPE) values('LOADER', 'ORA_LOADER');
insert into T_COMP_CLASS(CLASS_NAME, COMP_TYPE) values('LOADER', 'MYSQL_LOADER');
insert into T_COMP_CLASS(CLASS_NAME, COMP_TYPE) values('LOADER', 'MSS_LOADER');
insert into T_COMP_CLASS(CLASS_NAME, COMP_TYPE) values('LOADER', 'DB2_LOADER');
insert into T_COMP_CLASS(CLASS_NAME, COMP_TYPE) values('LOADER', 'COM_LOADER');
insert into T_COMP_CLASS(CLASS_NAME, COMP_TYPE) values('TRANSFER', 'TCLIENT');
insert into T_COMP_CLASS(CLASS_NAME, COMP_TYPE) values('FULLSYNC', 'ORA_FULLSYNC');
insert into T_COMP_CLASS(CLASS_NAME, COMP_TYPE) values('FULLSYNC', 'MYSQL_FULLSYNC');
insert into T_COMP_CLASS(CLASS_NAME, COMP_TYPE) values('FULLSYNC', 'MSS_FULLSYNC');
insert into T_COMP_CLASS(CLASS_NAME, COMP_TYPE) values('FULLSYNC', 'DB2_FULLSYNC');
insert into T_COMP_CLASS(CLASS_NAME, COMP_TYPE) values('ETL', 'ETLSERVER');
insert into T_COMP_CLASS(CLASS_NAME, COMP_TYPE) values('FTP', 'FTP');
insert into T_COMP_CLASS(CLASS_NAME, COMP_TYPE) values('OTHER', 'OTHER');
