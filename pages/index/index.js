// index.js
const api = require('../../utils/api')
const md = require('../../utils/markdown')

Page({
  data: {
    messages: [
      {
        role: 'assistant',
        content: '你好，我是你的 AI 购物助手。有什么我可以帮你的吗？支持订单查询和商品导购。',
        htmlContent: md.parseMarkdown('你好，我是你的 AI 购物助手。有什么我可以帮你的吗？支持订单查询和商品导购。')
      }
    ],
    inputValue: '',
    isTyping: false,
    scrollToMessage: ''
  },
  
  onLoad() {
    this.checkLogin();
  },

  onShow() {
    this.checkLogin();
  },

  checkLogin() {
    const token = wx.getStorageSync('token');
    if (!token) {
      wx.redirectTo({
        url: '/pages/login/login', // 如果没有token则重定向到登录页
      });
    }
  },

  onInput(e) {
    this.setData({
      inputValue: e.detail.value
    });
  },

  async sendMessage() {
    const text = this.data.inputValue.trim();
    if (!text || this.data.isTyping) return;

    // 获取当前用户ID用于后端调用
    const userInfo = wx.getStorageSync('userInfo');
    const userId = userInfo ? userInfo.id : null;

    // 更新消息列表
    const newMessages = [...this.data.messages, { role: 'user', content: text, htmlContent: null }];
    this.setData({
      messages: newMessages,
      inputValue: '',
      isTyping: true
    });
    this.scrollToBottom();

    try {
      // 构造请求给后端的 messages，过滤掉非 user/assistant 消息或者内部状态
      const requestMessages = newMessages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const res = await api.chatAuto({
        messages: requestMessages,
        user_id: userId,
        temperature: 0.7,
        max_tokens: 1024
      });

      // 准备打字机效果的空白回复
      const aiReplyTemplate = {
        role: 'assistant',
        content: '',
        htmlContent: '',
        tool_used: res.tool_used,
        tool_name: res.tool_name,
        intent: res.intent
      };

      const aiReplyIndex = this.data.messages.length;

      this.setData({
        messages: [...this.data.messages, aiReplyTemplate],
        isTyping: false
      });
      this.scrollToBottom();

      // 开始模拟流式打字输出
      this.simulateSlowTyping(res.content, aiReplyIndex);

    } catch (err) {
      console.error('发送消息失败:', err);
      const errorMsg = {
        role: 'assistant',
        content: '抱歉，网络遇到了一些问题，请稍后再试。'
      };
      
      this.setData({
        messages: [...this.data.messages, errorMsg],
        isTyping: false
      });
      this.scrollToBottom();
    }
  },

  // 模拟打字机慢输出功能
  simulateSlowTyping(fullText, messageIndex) {
    if (!fullText) return;
    
    let currentIndex = 0;
    
    // 设置一个定时器，每次输出两到三个字符速度会更好，这里假设每个字符延迟30毫秒
    const typingInterval = setInterval(() => {
      if (currentIndex < fullText.length) {
        // 更新对应索引位置的气泡内容
        const currentMessages = this.data.messages;
        const currentChar = fullText.charAt(currentIndex);
        currentMessages[messageIndex].content += currentChar;
        currentMessages[messageIndex].htmlContent = md.parseMarkdown(currentMessages[messageIndex].content);
        
        this.setData({
          messages: currentMessages
        });
        
        // 可选：为了防止高频滚动导致卡顿，可以稍微做下稀释
        // 或者简单判断如果是换行符就触发一次滚动
        if (currentIndex % 15 === 0 || currentChar === '\n') {
            this.scrollToBottom();
        }

        currentIndex++;
      } else {
        clearInterval(typingInterval);
        this.scrollToBottom();
      }
    }, 30); // 输出速度：每30毫秒输出一个字符
  },

  scrollToBottom() {
    if (this.scrollTimer) {
      clearTimeout(this.scrollTimer);
    }
    this.scrollTimer = setTimeout(() => {
      this.setData({
        scrollToMessage: 'msg-bottom'
      });
    }, 50);
  }
})
