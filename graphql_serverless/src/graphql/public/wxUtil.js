const wxCfg = require('../../../config/wechat');
const superagent = require('superagent');

const request = (code) => {
    const url = `${wxCfg.url}?appid=${wxCfg.appId}&secret=${wxCfg.secret}&js_code=${code}&grant_type=authorization_code`;
    return superagent.get(url);
};

const login = async (code) => {
    const res = await request(code);
    if (res.statusCode !== 200) {
        console.error('wechat server res: ', res);
        throw new Error(`Request remote wechat server fail: ${res.statusCode}`);
    }
    return JSON.parse(res.text);
};

module.exports = {
    login,
};
