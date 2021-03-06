/**
 * Created by cage on 2016/10/21.
 */
'use strict';
var errorCode =  {
    ENOENT: "00001",
    EEXIST: "00002",
    EMD5:"00003",
    ENOID:"00004",
    EAUTOCOMMIT:"00005",
    EDBTYPE:"00006",
    EDBENV:"00007",
    EEXTERNALPARAM:"00008",
    EEXCEED : "00009",
    EBUSY : "00010",
    ETOOSHORT: "00011",
    EFILEOPEN: "00012",
    EFILEWR: "00013",
    EFILERD: "00014",
    EFILETRUN: "00015",
    EDOWNLOAD: "00016",
    EAUTH: "00017",
    ENSUPPORT: "00018",
    EDBVERSION:"00019",
    ECHECKROLLTABLE:"00020",
    ECREATEROLLTABLE:"00021",
    ENULL:"00022",
    EGETDBTYPE:"00023",
    EOPERTABLE:"00024",
    ECHECKCOLUMN:"00025",
    EGETALLCOUNT:"00026",
    EOPTYPE:"00027",
    EDBERROR: "01001",
    EDBOPEN: "01002",
    EDBPREPARE: "01003",
    EDBEXECUTE: "01004",
    EDBCLOSE: "01005",
    EBTRAN: "01006",
    ERTRAN: "01007",
    ECTRAN: "01008",
    EOTHER: "02001"
};

module.exports = errorCode;
