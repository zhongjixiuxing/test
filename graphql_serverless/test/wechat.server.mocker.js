const port = 10872;

const http = require('http');
const url = require('url');

class WechatServerMocker {
    constructor(reqCB) {
        if (reqCB) {
            this.reqCB = reqCB;
        }
    }

    /***
     * 启动WeChat mocker server
     *
     * @param reqCB 新请求进来的callback
     */
    start(reqCB){
        if (reqCB) {
            this.reqCB = reqCB;
        }
        console.log('starting wechat mocker server  ...');

        return new Promise((resolve, reject) => {
            const server = http.createServer( (req, res) => {
                // res.writeHead(200, {'Content-Type': 'text/html'});
                // const q = url.parse(req.url, true).query;
                // // 在cfg 传入rules进来，根据不同的rules
                //
                // const txt = JSON.stringify({openid: 'anxing'});
                // res.end(txt);

                if (this.reqCB) {
                    this.reqCB.cb(req, res);
                }
            }).listen(port);

            console.log(`listen wechat mocker server in ${port}`);
            this.server = server;
            resolve(this);
        });
    }

    stop() {
        if (this.server) {
            this.server.close();
            this.server = null;
        }
    }
}

module.exports = {
    WechatServerMocker
};
