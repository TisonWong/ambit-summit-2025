$(function () {
  var app = new Vue({
    el: '#app',
    data: {
      all: '',
      sessions: '',
      MAX_CHARACTERS: 250, // 控制长文本最大显示字符数
      currentGuest: '',
      // 用于保存滚动位置的变量
      savedScrollPosition: 0,
    },
    created: function () {
      fetch('./static/data/guest.json')
        .then((response) => {
          if (!response.ok) {
            throw new Error('Network exception, please try again later');
          }
          return response.json(); // 这会解析JSON并返回一个Promise
        })
        .then((jsonData) => {
          this.all = jsonData;
          this.initData();
        })
        .catch((error) => {
          // 处理加载JSON时的错误
          console.error('Could not load json:', error);
        });
    },
    computed: {
      guestsMap() {
        // 缓存嘉宾资料Map,以GuestID为主键
        const map = {};
        for (const guest of this.all.guests) {
          map[guest.guestId] = guest;
        }
        return map;
      },
    },
    methods: {
      initData: function () {
        if (this.all.sessions && Array.isArray(this.all.sessions)) {
          // 处理长文本部分隐藏的代码, 针对主题描述"themeInfo"
          // 确保 this.all.sessions 存在且是一个数组
          this.sessions = this.all.sessions.map((session) => {
            // 如果 session.speechs 不存在或者不是数组，使用空数组作为默认值
            const speechs = Array.isArray(session.speechs)
              ? session.speechs
              : [];
            return {
              ...session,
              speechs: speechs.map((speech) => ({
                ...speech,
                isExpanded: false,
                brief: speech.themeInfo
                  ? truncateOnWord(speech.themeInfo || '', this.MAX_CHARACTERS)
                  : '', // 防止 themeInfo 不存在的情况
              })),
            };
          });
        } else {
          // 处理 json.sessions 不是数组或者不存在的情况
          this.sessions = [];
        }
      },
      aboutTheme: function (index) {
        return 'aboutTheme_' + index;
      },
      aboutGuest: function (index) {
        return 'aboutGuest_' + index;
      },
      aboutCompany: function (index) {
        return 'aboutCompany_' + index;
      },
      sessionId: function (index) {
        return 'sessiom_' + index;
      },
      aboutSubjectGroup: function (index) {
        return 'aboutSubjectGroup_' + index;
      },
      aboutSubject: function (index) {
        return 'aboutSubject_' + index;
      },
      changeUrl: function (url) {
        return this.all.loadUrl + url.substr(url.indexOf('/') + 1, url.lenght);
      },
      toggle(speech) {
        speech.isExpanded = !speech.isExpanded;
      },
      showInfo(guest, event) {
        this.currentGuest = guest;
        const imgRect = event.target.getBoundingClientRect();
        const topPosition = imgRect.bottom + window.scrollY;
        const leftPosition = imgRect.left + imgRect.width / 2 + window.scrollX; // 图片中心的水平位置

        const infoElement = document.querySelector('.guestInfo');
        this.$nextTick(() => {
          // 确保.guestInfo完全加载后再获取宽度
          const infoWidth = infoElement.offsetWidth;
          // 检查是否超出屏幕右侧
          if (leftPosition + infoWidth / 2 > window.innerWidth) {
            // 如果超出，向左调整位置
            infoElement.style.left = `${window.innerWidth - infoWidth}px`;
          } else if (leftPosition - infoWidth / 2 < 0) {
            // 检查是否超出屏幕左侧
            infoElement.style.left = `0px`;
          } else {
            // 居中
            infoElement.style.left = `${leftPosition}px`;
          }
          // 应用位置调整
          infoElement.style.top = `${topPosition}px`;
          infoElement.style.visibility = 'visible';
        });
      },
      hideInfo() {
        const infoElement = document.querySelector('.guestInfo');
        infoElement.style.visibility = 'hidden';
      },
      toggleBooths(session) {
        // 如果session对象中没有showBooths属性，则初始化为false
        if (session.showBooths === undefined) {
          this.$set(session, 'showBooths', false);
        }
        // 切换展示状态
        session.showBooths = !session.showBooths;
      },
      isChinese(text) {
        return /[\u4e00-\u9fa5]/.test(text);
      },
      getSessionsByDay(dayId) {
        if (!this.sessions) return [];
        return this.sessions.filter(function (s) {
          return s.dayId === dayId;
        });
      },
      getDayInfo(dayId) {
        if (!this.all || !this.all.eventInfo) return {};
        var arr = this.all.eventInfo.eventDate || [];
        return (
          arr.find(function (d) {
            return d.id === dayId;
          }) || {}
        );
      },
    },
  });
});

// 监听点击事件,放大显示图片
function showImg(img) {

  var imgsrc = $(img).attr('src');
  console.log(imgsrc);
  var opacityBottom =
    '<div class="opacityBottom" style = "display:none"><img class="bigImg" src="' +
    imgsrc +
    '"></div>';
  $(document.body).append(opacityBottom);
  toBigImg(); //放大图片函数
}

function toBigImg() {
  $('.opacityBottom').addClass('opacityBottom'); //添加遮罩层
  $('.opacityBottom').show();
  $('html,body').addClass('none-scroll'); //下层不可滑动
  $('.bigImg').addClass('bigImg'); //添加图片样式
  $('.opacityBottom').click(function () {
    //点击关闭
    $('html,body').removeClass('none-scroll');
    $('.opacityBottom').remove();
  });
}

// 智能截取英文单词
function truncateOnWord(str, limit) {
  if (str.length <= limit) {
    return str;
  }

  // 查找最接近限制长度的空格
  let cutOffPoint = str.lastIndexOf(' ', limit);

  // 如果没有找到空格，可能是一个很长的单词或者限制长度太小，只好在限制长度处截断
  if (cutOffPoint === -1) {
    cutOffPoint = limit;
  }

  return str.substring(0, cutOffPoint) + '...'; // 截断文本并添加省略号
}
