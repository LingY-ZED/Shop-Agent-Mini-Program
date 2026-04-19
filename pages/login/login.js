// pages/login/login.js
const api = require('../../utils/api')

Page({
  data: {
    username: '',
    password: '',
    email: '',
    isRegister: false,
    loading: false
  },

  onLoad() {
    // 检查是否已登录
    const token = wx.getStorageSync('token');
    if (token) {
      wx.redirectTo({
        url: '/pages/index/index',
      });
    }
  },

  bindUsernameInput(e) {
    this.setData({
      username: e.detail.value
    });
  },

  bindPasswordInput(e) {
    this.setData({
      password: e.detail.value
    });
  },

  bindEmailInput(e) {
    this.setData({
      email: e.detail.value
    });
  },

  toggleAction() {
    this.setData({
      isRegister: !this.data.isRegister
    });
  },

  async handleAction() {
    const { username, password, email, isRegister } = this.data;
    if (!username || !password) {
      wx.showToast({
        title: '请输入账号和密码',
        icon: 'none'
      });
      return;
    }

    this.setData({ loading: true });

    try {
      let res;
      if (isRegister) {
        res = await api.register({ username, password, email });
        wx.showToast({
          title: '注册成功，已登录',
          icon: 'success'
        });
      } else {
        res = await api.login({ username, password });
        wx.showToast({
          title: '登录成功',
          icon: 'success'
        });
      }

      // 保存 token 到本地
      wx.setStorageSync('token', res.access_token);
      wx.setStorageSync('userInfo', {
        id: res.user_id,
        username: res.username
      });

      // 跳转到首页
      wx.redirectTo({
        url: '/pages/index/index',
      });
    } catch (error) {
      console.error(error);
    } finally {
      this.setData({ loading: false });
    }
  }
})
