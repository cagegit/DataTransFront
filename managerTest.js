/**
 * Created by cage on 2016/9/11.
 */
'use strict';
const cluster = require('cluster');
const numCPUs = require('os').cpus().length;
cluster.schedulingPolicy=cluster.SCHED_RR;//负载均衡
if (cluster.isMaster) {
    console.log(`Master ${process.pid} is running`);
    // Fork workers.
    for (let i = 0; i < numCPUs; i++) {
        cluster.fork();
    }
    cluster.on('online', worker => {
        console.log('Worker ' + worker.process.pid + ' is online')
    })
    cluster.on('exit', (worker, code, signal) => {
        console.log(`worker ${worker.process.pid} died`);
        setTimeout(function () {
            cluster.fork();
        },5000);
    });
} else {
    console.log('express:'+cluster.worker.process.pid);
    // console.log(cluster.worker);
    require('./worker');
}