const BASE_URL = 'http://localhost:8001'; // 修改为实际的后端地址

const request = (url, method, data, needAuth = true) => {
  return new Promise((resolve, reject) => {
    const header = {};
    if (needAuth) {
      const token = wx.getStorageSync('token');
      if (token) {
        header['Authorization'] = `Bearer ${token}`;
      }
    }
    
    wx.request({
      url: `${BASE_URL}${url}`,
      method: method,
      data: data,
      header: header,
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data);
        } else if (res.statusCode === 401) {
          // 未授权，清除登录状态并跳转到登录页
          wx.removeStorageSync('token');
          wx.removeStorageSync('userInfo');
          wx.reLaunch({
            url: '/pages/login/login',
          });
          reject(res);
        } else {
          wx.showToast({
            title: res.data.detail || '请求失败',
            icon: 'none'
          });
          reject(res);
        }
      },
      fail: (err) => {
        wx.showToast({
          title: '网络错误',
          icon: 'none'
        });
        reject(err);
      }
    });
  });
};

module.exports = {
  login: (data) => request('/api/auth/login', 'POST', data, false),
  register: (data) => request('/api/auth/register', 'POST', data, false),
  getUserInfo: () => request('/api/auth/me', 'GET'),
  chatAuto: (data) => request('/api/chat/auto', 'POST', data),
};
