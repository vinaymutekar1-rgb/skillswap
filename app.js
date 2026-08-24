/*
 * SkillSwap - Campus Skill Exchange
 * Prototype data layer — localStorage.
 * For production, replace DataStore with Firebase/Firestore.
 */

// ===== DATA STORE =====
const DataStore = {
    init() {
        if (!localStorage.getItem('skillswap_init')) {
            this.resetData();
            localStorage.setItem('skillswap_init', 'true');
        }
    },

    getUsers() { return JSON.parse(localStorage.getItem('users') || '[]'); },
    getUser(id) { return this.getUsers().find(u => u.id === id); },
    saveUser(user) {
        const users = this.getUsers();
        const idx = users.findIndex(u => u.id === user.id);
        if (idx >= 0) users[idx] = user;
        else users.push(user);
        localStorage.setItem('users', JSON.stringify(users));
    },

    getRequests() { return JSON.parse(localStorage.getItem('requests') || '[]'); },
    createRequest(req) {
        const reqs = this.getRequests();
        req.id = 'req_' + Date.now();
        req.createdAt = new Date().toISOString();
        reqs.push(req);
        localStorage.setItem('requests', JSON.stringify(reqs));
        return req;
    },
    updateRequest(id, data) {
        const reqs = this.getRequests();
        const req = reqs.find(r => r.id === id);
        if (req) {
            Object.assign(req, data);
            localStorage.setItem('requests', JSON.stringify(reqs));
        }
        return req;
    },

    getChats() { return JSON.parse(localStorage.getItem('chats') || '[]'); },
    getChat(id) { return this.getChats().find(c => c.id === id); },
    createChat(chat) {
        const chats = this.getChats();
        chat.id = 'chat_' + Date.now();
        chats.push(chat);
        localStorage.setItem('chats', JSON.stringify(chats));
        return chat;
    },
    addMessage(chatId, msg) {
        const chats = this.getChats();
        const chat = chats.find(c => c.id === chatId);
        if (chat) {
            msg.id = 'msg_' + Date.now();
            msg.timestamp = new Date().toISOString();
            chat.messages.push(msg);
            chat.lastMessage = msg.text;
            chat.lastMessageTime = msg.timestamp;
            localStorage.setItem('chats', JSON.stringify(chats));
        }
    },

    getSessions() { return JSON.parse(localStorage.getItem('sessions') || '[]'); },
    getSession(id) { return this.getSessions().find(s => s.id === id); },
    createSession(sess) {
        const sessions = this.getSessions();
        sess.id = 'sess_' + Date.now();
        sess.createdAt = new Date().toISOString();
        sessions.push(sess);
        localStorage.setItem('sessions', JSON.stringify(sessions));
        return sess;
    },
    updateSession(id, data) {
        const sessions = this.getSessions();
        const sess = sessions.find(s => s.id === id);
        if (sess) {
            Object.assign(sess, data);
            localStorage.setItem('sessions', JSON.stringify(sessions));
        }
        return sess;
    },

    getCredits() { return JSON.parse(localStorage.getItem('credits') || '[]'); },
    addCredit(userId, amount, desc) {
        const credits = this.getCredits();
        credits.push({
            id: 'cred_' + Date.now(),
            userId,
            amount,
            description: desc,
            date: new Date().toISOString()
        });
        localStorage.setItem('credits', JSON.stringify(credits));
    },

    getReviews() { return JSON.parse(localStorage.getItem('reviews') || '[]'); },
    createReview(rev) {
        const reviews = this.getReviews();
        rev.id = 'rev_' + Date.now();
        rev.createdAt = new Date().toISOString();
        reviews.push(rev);
        localStorage.setItem('reviews', JSON.stringify(reviews));
        return rev;
    },

    getProgress() { return JSON.parse(localStorage.getItem('progress') || '[]'); },
    saveProgress(prog) {
        const all = this.getProgress();
        const idx = all.findIndex(p => p.id === prog.id);
        if (idx >= 0) all[idx] = prog;
        else all.push(prog);
        localStorage.setItem('progress', JSON.stringify(all));
    },

    getNotifications() { return JSON.parse(localStorage.getItem('notifications') || '[]'); },
    createNotification(notif) {
        const notifs = this.getNotifications();
        notif.id = 'notif_' + Date.now();
        notif.createdAt = new Date().toISOString();
        notif.read = false;
        notifs.push(notif);
        localStorage.setItem('notifications', JSON.stringify(notifs));
        return notif;
    },
    markNotificationRead(id) {
        const notifs = this.getNotifications();
        const n = notifs.find(x => x.id === id);
        if (n) {
            n.read = true;
            localStorage.setItem('notifications', JSON.stringify(notifs));
        }
    },

    resetData() {
        localStorage.clear();
        localStorage.setItem('users', JSON.stringify(DEMO_USERS));
        localStorage.setItem('requests', '[]');
        localStorage.setItem('chats', '[]');
        localStorage.setItem('sessions', '[]');
        localStorage.setItem('credits', '[]');
        localStorage.setItem('reviews', '[]');
        localStorage.setItem('progress', '[]');
        localStorage.setItem('notifications', '[]');
        localStorage.setItem('skillswap_init', 'true');
    }
};

// ===== DEMO DATA =====
const DEMO_USERS = [
    { id: 'u1', name: 'Arjun Mehta', department: 'CS', year: 3, college: 'IIT Bombay', bio: 'Backend developer passionate about learning', avatar: 'AM', canTeach: ['Python', 'Django', 'DSA'], wantLearn: ['UI/UX', 'Public Speaking'], availability: ['Weekdays', 'Evening'], sessionMode: 'Online', credits: 25, rating: 4.8, reviewCount: 5, sessions: 8, verified: ['Python'] },
    { id: 'u2', name: 'Karan Joshi', department: 'Business', year: 2, college: 'IIT Bombay', bio: 'MBA student focused on entrepreneurship', avatar: 'KJ', canTeach: ['Public Speaking', 'Excel'], wantLearn: ['Python', 'Data Analysis'], availability: ['Weekends', 'Evening'], sessionMode: 'Both', credits: 18, rating: 4.6, reviewCount: 3, sessions: 5, verified: ['Public Speaking'] },
    { id: 'u3', name: 'Sneha Kulkarni', department: 'Design', year: 4, college: 'IIT Bombay', bio: 'UX/UI designer with startup experience', avatar: 'SK', canTeach: ['UI/UX', 'Figma', 'Design Thinking'], wantLearn: ['Python'], availability: ['Weekdays'], sessionMode: 'Online', credits: 32, rating: 4.9, reviewCount: 8, sessions: 12, verified: ['Figma'] },
    { id: 'u4', name: 'Priya Singh', department: 'Arts', year: 2, college: 'IIT Bombay', bio: 'Photographer and content creator', avatar: 'PS', canTeach: ['Photography', 'Video Editing'], wantLearn: ['Python', 'Marketing'], availability: ['Flexible'], sessionMode: 'Both', credits: 28, rating: 4.8, reviewCount: 6, sessions: 10, verified: ['Photography'] },
    { id: 'u5', name: 'Rohit Verma', department: 'CS', year: 1, college: 'IIT Bombay', bio: 'First year eager to learn', avatar: 'RV', canTeach: ['Mathematics', 'Competitive Programming'], wantLearn: ['Full-stack'], availability: ['Evening'], sessionMode: 'Online', credits: 10, rating: 4.5, reviewCount: 2, sessions: 3, verified: [] },
    { id: 'u6', name: 'Anjali Menon', department: 'Business', year: 3, college: 'IIT Bombay', bio: 'Finance enthusiast', avatar: 'AM', canTeach: ['Financial Analysis', 'Stock Market'], wantLearn: ['Python', 'Data Science'], availability: ['Weekends'], sessionMode: 'Both', credits: 20, rating: 4.6, reviewCount: 3, sessions: 5, verified: ['Financial Analysis'] },
    { id: 'u7', name: 'Nikhil Patel', department: 'CS', year: 4, college: 'IIT Bombay', bio: 'Full-stack developer', avatar: 'NP', canTeach: ['React', 'Node.js'], wantLearn: ['Machine Learning'], availability: ['Evening'], sessionMode: 'Online', credits: 35, rating: 4.9, reviewCount: 7, sessions: 11, verified: ['React'] },
    { id: 'u8', name: 'Rajeev Kumar', department: 'Engineering', year: 3, college: 'IIT Bombay', bio: 'Electronics enthusiast', avatar: 'RK', canTeach: ['Electronics', 'Arduino'], wantLearn: ['Web Dev'], availability: ['Weekends'], sessionMode: 'Offline', credits: 22, rating: 4.7, reviewCount: 4, sessions: 7, verified: ['Arduino'] }
];

// ===== MATCHING ENGINE =====
class Matcher {
    match(s1, s2) {
        let score = 0;
        const s1Teach = new Set(s1.canTeach);
        const s1Learn = new Set(s1.wantLearn);
        const s2Teach = new Set(s2.canTeach);
        const s2Learn = new Set(s2.wantLearn);

        const s1_to_s2 = [...s1Teach].filter(x => s2Learn.has(x));
        const s2_to_s1 = [...s2Teach].filter(x => s1Learn.has(x));

        if (s1_to_s2.length && s2_to_s1.length) score += 40;
        else if (s1_to_s2.length || s2_to_s1.length) score += 20;

        const common = [...new Set(s1.availability)].filter(x => new Set(s2.availability).has(x));
        if (common.length) score += 15;
        if (s1.sessionMode === s2.sessionMode || s1.sessionMode === 'Both' || s2.sessionMode === 'Both') score += 10;
        if (s1.college === s2.college) score += 10;
        if (s2.rating >= 4.7) score += 15;
        if (s2.sessions >= 8) score += 10;

        return { score: Math.min(score, 100) };
    }

    getMatches(userId) {
        const s = DataStore.getUser(userId);
        const others = DataStore.getUsers().filter(u => u.id !== userId);
        return others.map(o => ({ user: o, ...this.match(s, o) })).sort((a, b) => b.score - a.score);
    }
}

const matcher = new Matcher();

// ===== APP =====
const app = {
    currentUserId: null,
    currentView: 'dashboard',
    currentChat: null,

    init() {
        DataStore.init();
        const saved = localStorage.getItem('currentUser');
        if (saved && DataStore.getUser(saved)) {
            this.setCurrentUser(saved);
            this.showApp();
        } else {
            this.showLogin();
        }
    },

    showLogin() {
        document.getElementById('loginScreen').classList.remove('hidden');
        document.getElementById('appContainer').classList.add('hidden');
        const list = document.getElementById('studentList');
        list.innerHTML = DataStore.getUsers().map(u =>
            `<button class="student-button" data-user-id="${u.id}">
                <div class="student-name">${u.name}</div>
                <div class="student-meta">${u.department} • Year ${u.year}</div>
            </button>`
        ).join('');

        list.querySelectorAll('.student-button').forEach(btn => {
            btn.addEventListener('click', () => {
                app.setCurrentUser(btn.dataset.userId);
            });
        });
    },

    showApp() {
        document.getElementById('loginScreen').classList.add('hidden');
        document.getElementById('appContainer').classList.remove('hidden');
        this.updateHeader();
        this.renderDashboard();
    },

    setCurrentUser(id) {
        this.currentUserId = id;
        localStorage.setItem('currentUser', id);
        this.showApp();
    },

    switchStudent() {
        this.showLogin();
    },

    navigate(view) {
        this.currentView = view;
        document.querySelectorAll('.view-section').forEach(v => v.classList.remove('active'));
        document.getElementById(view).classList.add('active');
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

        const navItem = document.querySelector(`.nav-item[data-view="${view}"]`);
        if (navItem) navItem.classList.add('active');

        document.getElementById('viewTitle').textContent = view.charAt(0).toUpperCase() + view.slice(1);

        if (view === 'dashboard') this.renderDashboard();
        else if (view === 'board') this.renderBoard();
        else if (view === 'matches') this.renderMatches();
        else if (view === 'requests') this.renderRequests();
        else if (view === 'messages') this.renderMessages();
        else if (view === 'sessions') this.renderSessions();
        else if (view === 'credits') this.renderCredits();
        else if (view === 'progress') this.renderProgress();
        else if (view === 'leaderboard') this.renderLeaderboard();
        else if (view === 'profile') this.renderProfile();
        else if (view === 'notifications') this.renderNotifications();
        else if (view === 'admin') this.renderAdmin();
    },

    updateHeader() {
        const u = DataStore.getUser(this.currentUserId);
        document.getElementById('userName').textContent = u.name.split(' ')[0];
        document.getElementById('userAvatar').textContent = u.avatar;
    },

    renderDashboard() {
        const u = DataStore.getUser(this.currentUserId);
        document.getElementById('dashboardName').textContent = u.name.split(' ')[0];

        const reqs = DataStore.getRequests().filter(r => (r.senderId === this.currentUserId || r.receiverId === this.currentUserId) && r.status === 'accepted');
        const sesses = DataStore.getSessions().filter(s => (s.teacherId === this.currentUserId || s.learnerId === this.currentUserId) && new Date(s.date) >= new Date());
        const credits = DataStore.getCredits().filter(c => c.userId === this.currentUserId).reduce((s, c) => s + c.amount, 0);

        document.getElementById('statCredits').textContent = credits;
        document.getElementById('statSwaps').textContent = reqs.length;
        document.getElementById('statSessions').textContent = sesses.length;
        document.getElementById('statRating').textContent = u.rating ? u.rating.toFixed(1) : '--';

        const matches = matcher.getMatches(this.currentUserId).slice(0, 3);
        document.getElementById('dashboardMatches').innerHTML = matches.map(m =>
            `<div class="card-compact">
                <div class="flex-between">
                    <div>
                        <div style="font-weight: 600; margin-bottom: 2px;">${m.user.name}</div>
                        <div class="text-muted">${m.score}% compatible</div>
                    </div>
                    <button class="btn-primary btn-sm btn-request" data-user-id="${m.user.id}">✨ Request</button>
                </div>
            </div>`
        ).join('');
        this._bindButtons('#dashboardMatches .btn-request', (id) => this.initiateSwapRequest(id));

        document.getElementById('dashboardSessions').innerHTML = sesses.length === 0 ? '<p class="text-muted">No upcoming sessions</p>' : sesses.slice(0, 3).map(s =>
            `<div class="card-compact">
                <div class="flex-between">
                    <div>
                        <div style="font-weight: 600; margin-bottom: 2px;">${s.skill}</div>
                        <div class="text-muted">${new Date(s.date).toLocaleDateString()} at ${s.time}</div>
                    </div>
                    <span class="badge badge-success">${s.status}</span>
                </div>
            </div>`
        ).join('');
    },

    renderBoard() {
        const others = DataStore.getUsers().filter(u => u.id !== this.currentUserId);
        this.displayBoardCards(others);
    },

    displayBoardCards(users) {
        document.getElementById('boardCards').innerHTML = users.map(u =>
            `<div class="card">
                <div style="display: flex; gap: 14px; align-items: flex-start; margin-bottom: 16px;">
                    <div style="width: 48px; height: 48px; border-radius: 50%; background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary)); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 16px; color: white; flex-shrink: 0;">${u.avatar}</div>
                    <div style="flex: 1;">
                        <div style="font-weight: 600; margin-bottom: 2px;">${u.name}</div>
                        <div class="text-muted">${u.department} • Year ${u.year}</div>
                        <div style="font-size: 13px; color: var(--text-secondary); margin-top: 4px;">${u.bio}</div>
                    </div>
                </div>
                <div style="margin-bottom: 12px;">
                    <div style="font-size: 12px; font-weight: 600; margin-bottom: 6px;">Can Teach</div>
                    <div>${u.canTeach.map(s => `<span class="skill-tag">${s}</span>`).join('')}</div>
                </div>
                <div style="margin-bottom: 16px;">
                    <div style="font-size: 12px; font-weight: 600; margin-bottom: 6px;">Wants to Learn</div>
                    <div>${u.wantLearn.map(s => `<span class="skill-tag">${s}</span>`).join('')}</div>
                </div>
                <div style="display: flex; gap: 8px;">
                    <button class="btn-primary btn-sm btn-request" data-user-id="${u.id}">✨ Request</button>
                    <button class="btn-secondary btn-sm btn-view-profile" data-user-id="${u.id}">👤 View</button>
                </div>
            </div>`
        ).join('');
        this._bindButtons('#boardCards .btn-request', (id) => this.initiateSwapRequest(id));
        this._bindButtons('#boardCards .btn-view-profile', (id) => this.viewProfile(id));
    },

    filterBoard() {
        const search = document.getElementById('boardSearch').value.toLowerCase();
        const dept = document.getElementById('departmentFilter').value;
        const avail = document.getElementById('availabilityFilter').value;
        let users = DataStore.getUsers().filter(u => u.id !== this.currentUserId);
        if (search) users = users.filter(u => u.name.toLowerCase().includes(search) || u.canTeach.some(s => s.toLowerCase().includes(search)));
        if (dept) users = users.filter(u => u.department === dept);
        if (avail) users = users.filter(u => u.availability.includes(avail));
        this.displayBoardCards(users);
    },

    renderMatches() {
        const matches = matcher.getMatches(this.currentUserId);
        document.getElementById('matchesContainer').innerHTML = matches.map(m =>
            `<div class="card">
                <div style="display: flex; gap: 14px; margin-bottom: 14px;">
                    <div style="width: 48px; height: 48px; border-radius: 50%; background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary)); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 16px; color: white; flex-shrink: 0;">${m.user.avatar}</div>
                    <div style="flex: 1;">
                        <div style="font-weight: 600;">${m.user.name}</div>
                        <div class="text-muted">${m.user.department} • ${m.user.rating} ⭐</div>
                        <div style="font-size: 18px; font-weight: 800; margin-top: 6px; background: linear-gradient(135deg, var(--success), #3dd68e); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">${m.score}%</div>
                    </div>
                </div>
                <div style="display: flex; gap: 8px;">
                    <button class="btn-primary btn-sm btn-request" data-user-id="${m.user.id}">Request</button>
                    <button class="btn-secondary btn-sm btn-view-profile" data-user-id="${m.user.id}">Profile</button>
                </div>
            </div>`
        ).join('');
        this._bindButtons('#matchesContainer .btn-request', (id) => this.initiateSwapRequest(id));
        this._bindButtons('#matchesContainer .btn-view-profile', (id) => this.viewProfile(id));
    },

    sortMatches(by) {
        const matches = matcher.getMatches(this.currentUserId);
        if (by === 'rating') matches.sort((a, b) => b.user.rating - a.user.rating);
        else if (by === 'active') matches.sort((a, b) => b.user.sessions - a.user.sessions);
        this.renderMatches();
    },

    initiateSwapRequest(stuId) {
        const stu = DataStore.getUser(stuId);
        const cu = DataStore.getUser(this.currentUserId);
        const m = matcher.getMatches(this.currentUserId).find(x => x.user.id === stuId);

        const myTeach = cu.canTeach.filter(s => stu.wantLearn.includes(s))[0] || cu.canTeach[0];
        const theirTeach = stu.canTeach.filter(s => cu.wantLearn.includes(s))[0] || stu.canTeach[0];

        app._swapReq = { stuId, stuName: stu.name, mySkill: myTeach, theirSkill: theirTeach, score: m.score };
        document.getElementById('swapWithName').textContent = stu.name;
        document.getElementById('swapYourSkill').value = myTeach;
        document.getElementById('swapTheirSkill').value = theirTeach;
        document.getElementById('swapMessage').value = '';

        this.openModal('requestSwapModal');
    },

    submitSwapRequest() {
        const msg = document.getElementById('swapMessage').value;
        const dur = document.getElementById('swapDuration').value;
        const mode = document.getElementById('swapMode').value;

        DataStore.createRequest({
            senderId: this.currentUserId,
            receiverId: app._swapReq.stuId,
            senderName: DataStore.getUser(this.currentUserId).name,
            receiverName: app._swapReq.stuName,
            skillsExchanged: { teaching: app._swapReq.mySkill, learning: app._swapReq.theirSkill },
            compatibility: app._swapReq.score,
            duration: dur,
            mode,
            message: msg,
            status: 'pending'
        });

        DataStore.createNotification({
            userId: app._swapReq.stuId,
            type: 'request',
            title: `${DataStore.getUser(this.currentUserId).name} sent a request`,
            message: `${app._swapReq.mySkill} ↔ ${app._swapReq.theirSkill}`
        });

        this.showToast('Request sent!', 'success');
        this.closeModal();
    },

    renderRequests() {
        const reqs = DataStore.getRequests();
        const cu = this.currentUserId;

        const incoming = reqs.filter(r => r.receiverId === cu);
        const outgoing = reqs.filter(r => r.senderId === cu);
        const active = reqs.filter(r => (r.senderId === cu || r.receiverId === cu) && r.status === 'accepted');
        const completed = reqs.filter(r => (r.senderId === cu || r.receiverId === cu) && r.status === 'completed');

        document.getElementById('incoming').innerHTML = this.renderReqList(incoming);
        document.getElementById('outgoing').innerHTML = this.renderReqList(outgoing);
        document.getElementById('active-requests').innerHTML = this.renderReqList(active);
        document.getElementById('completed-requests').innerHTML = this.renderReqList(completed);
    },

    renderReqList(reqs) {
        if (!reqs.length) return '<p class="text-muted">No requests</p>';
        return reqs.map(r => {
            const isReceiver = r.receiverId === this.currentUserId;
            const otherName = isReceiver ? r.senderName : r.receiverName;
            let actions = '';
            if (isReceiver && r.status === 'pending') {
                actions = `<button class="btn-success btn-sm btn-accept" data-req-id="${r.id}">Accept</button>
                          <button class="btn-danger btn-sm btn-reject" data-req-id="${r.id}">Reject</button>`;
            } else if (!isReceiver && r.status === 'pending') {
                actions = `<button class="btn-danger btn-sm btn-cancel" data-req-id="${r.id}">Cancel</button>`;
            } else if (r.status === 'accepted') {
                actions = `<button class="btn-primary btn-sm btn-chat">Chat</button>`;
            }
            return `
                <div class="card-compact">
                    <div style="margin-bottom: 12px;">
                        <div style="font-weight: 600; margin-bottom: 4px;">${otherName}</div>
                        <div class="text-muted">${r.skillsExchanged.teaching} ↔ ${r.skillsExchanged.learning}</div>
                    </div>
                    <div style="display: flex; gap: 8px; align-items: center;">
                        ${actions}
                        <span class="badge" style="background: ${r.status === 'pending' ? 'rgba(240, 200, 90, 0.2); color: var(--warning)' : r.status === 'accepted' ? 'rgba(91, 224, 175, 0.2); color: var(--success)' : 'rgba(100, 100, 116, 0.2); color: var(--text-secondary)'};">${r.status}</span>
                    </div>
                </div>
            `;
        }).join('');
    },

    acceptRequest(reqId) {
        const req = DataStore.getRequests().find(r => r.id === reqId);
        DataStore.updateRequest(reqId, { status: 'accepted' });
        const existing = DataStore.getChats().find(c => (c.user1Id === req.senderId && c.user2Id === req.receiverId) || (c.user1Id === req.receiverId && c.user2Id === req.senderId));
        if (!existing) {
            DataStore.createChat({
                user1Id: req.senderId,
                user1Name: req.senderName,
                user2Id: req.receiverId,
                user2Name: req.receiverName,
                messages: []
            });
        }
        DataStore.createNotification({
            userId: req.senderId,
            type: 'accepted',
            title: `${req.receiverName} accepted your request`,
            message: `Ready to schedule?`
        });
        this.showToast('Request accepted!', 'success');
        this.renderRequests();
    },

    rejectRequest(reqId) { if (confirm('Reject this request?')) { DataStore.updateRequest(reqId, { status: 'rejected' }); this.showToast('Request rejected', 'success'); this.renderRequests(); } },
    cancelRequest(reqId) { if (confirm('Cancel this request?')) { DataStore.updateRequest(reqId, { status: 'cancelled' }); this.showToast('Request cancelled', 'success'); this.renderRequests(); } },

    renderMessages() {
        const chats = DataStore.getChats().filter(c => c.user1Id === this.currentUserId || c.user2Id === this.currentUserId);
        const list = document.getElementById('conversationList');
        if (!chats.length) {
            list.innerHTML = '<p class="text-muted" style="font-size: 12px;">No conversations</p>';
            document.getElementById('chatPanel').style.display = 'none';
        } else {
            list.innerHTML = chats.map(chat => {
                const otherName = chat.user1Id === this.currentUserId ? chat.user2Name : chat.user1Name;
                return `<div class="card-compact btn-open-chat" style="cursor: pointer;" data-chat-id="${chat.id}">
                    <div style="font-weight: 600; margin-bottom: 4px;">${otherName}</div>
                    <div class="text-muted" style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${chat.lastMessage || 'No messages'}</div>
                </div>`;
            }).join('');

            list.querySelectorAll('.btn-open-chat').forEach(el => {
                el.addEventListener('click', () => app.openChat(el.dataset.chatId));
            });
        }
    },

    openChat(chatId) {
        this.currentChat = chatId;
        const chat = DataStore.getChat(chatId);
        const otherName = chat.user1Id === this.currentUserId ? chat.user2Name : chat.user1Name;

        document.getElementById('chatTitle').textContent = otherName;
        document.getElementById('chatPanel').style.display = 'flex';
        document.getElementById('messageThread').style.display = 'block';
        document.getElementById('messageInputArea').style.display = 'block';

        const thread = document.getElementById('messageThread');
        thread.innerHTML = (chat.messages || []).map(msg =>
            `<div style="margin-bottom: 12px; text-align: ${msg.senderId === this.currentUserId ? 'right' : 'left'};">
                <div style="display: inline-block; background: ${msg.senderId === this.currentUserId ? 'var(--accent-primary)' : 'var(--bg-elevated)'}; color: white; padding: 10px 14px; border-radius: 12px; max-width: 70%; font-size: 13px;">
                    ${msg.text}
                </div>
            </div>`
        ).join('');
        thread.scrollTop = thread.scrollHeight;
    },

    sendMessage() {
        const text = document.getElementById('messageInput').value.trim();
        if (!text || !this.currentChat) return;
        DataStore.addMessage(this.currentChat, { senderId: this.currentUserId, text });
        document.getElementById('messageInput').value = '';
        this.openChat(this.currentChat);
    },

    renderSessions() {
        const sessions = DataStore.getSessions().filter(s => s.teacherId === this.currentUserId || s.learnerId === this.currentUserId);
        const now = new Date();

        const upcoming = sessions.filter(s => new Date(s.date) > now && s.status !== 'cancelled');
        const completed = sessions.filter(s => s.status === 'completed');
        const cancelled = sessions.filter(s => s.status === 'cancelled');

        document.getElementById('upcoming').innerHTML = upcoming.length === 0 ? '<p class="text-muted">No upcoming sessions</p>' : upcoming.map(s => this.renderSessionCard(s)).join('');
        document.getElementById('completed-sessions').innerHTML = completed.length === 0 ? '<p class="text-muted">No completed sessions</p>' : completed.map(s => this.renderSessionCard(s)).join('');
        document.getElementById('cancelled').innerHTML = cancelled.length === 0 ? '<p class="text-muted">No cancelled sessions</p>' : cancelled.map(s => this.renderSessionCard(s)).join('');

        const select = document.getElementById('scheduleWith');
        select.innerHTML = '<option value="">Select...</option>' + DataStore.getUsers().filter(u => u.id !== this.currentUserId).map(u => `<option value="${u.id}">${u.name}</option>`).join('');
    },

    renderSessionCard(sess) {
        const isTeacher = sess.teacherId === this.currentUserId;
        const otherName = isTeacher ? sess.learnerName : sess.teacherName;
        let actions = '';
        if (sess.status === 'scheduled') {
            actions = `<button class="btn-success btn-sm btn-complete" data-sess-id="${sess.id}">Complete</button>
                       <button class="btn-secondary btn-sm btn-cancel-sess" data-sess-id="${sess.id}">Cancel</button>`;
        } else if (sess.status === 'completed') {
            const hasReview = DataStore.getReviews().find(r => r.sessionId === sess.id && r.reviewerId === this.currentUserId);
            if (!hasReview) actions = `<button class="btn-primary btn-sm btn-review" data-sess-id="${sess.id}">Review</button>`;
        }
        return `
            <div class="card-compact">
                <div style="margin-bottom: 12px;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                        <div>
                            <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 4px;">${new Date(sess.date).toLocaleDateString()} at ${sess.time}</div>
                            <div style="font-weight: 600; margin-bottom: 4px;">${sess.skill}</div>
                            <div class="text-muted">with ${otherName}</div>
                        </div>
                        <span class="badge" style="background: ${sess.status === 'scheduled' ? 'rgba(86, 217, 255, 0.2); color: var(--accent-secondary)' : 'rgba(91, 224, 175, 0.2); color: var(--success)'};">${sess.status}</span>
                    </div>
                </div>
                <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 12px;">${sess.duration} min • ${sess.mode}</div>
                <div style="display: flex; gap: 8px;">${actions}</div>
            </div>
        `;
    },

    scheduleSession() {
        const withId = document.getElementById('scheduleWith').value;
        const skill = document.getElementById('scheduleSkill').value;
        const date = document.getElementById('scheduleDate').value;
        const time = document.getElementById('scheduleTime').value;
        const dur = document.getElementById('scheduleDuration').value;
        const mode = document.getElementById('scheduleMode').value;

        if (!withId || !skill || !date || !time) { this.showToast('Fill all fields', 'error'); return; }
        if (new Date(date) < new Date()) { this.showToast('Cannot schedule in the past', 'error'); return; }

        const other = DataStore.getUser(withId);
        DataStore.createSession({
            teacherId: this.currentUserId,
            teacherName: DataStore.getUser(this.currentUserId).name,
            learnerId: withId,
            learnerName: other.name,
            skill,
            date,
            time,
            duration: dur,
            mode,
            status: 'scheduled'
        });

        DataStore.createNotification({
            userId: withId,
            type: 'session',
            title: `${DataStore.getUser(this.currentUserId).name} scheduled a session`,
            message: `${skill} on ${new Date(date).toLocaleDateString()}`
        });

        this.showToast('Session scheduled!', 'success');
        this.closeModal();
        this.renderSessions();
    },

    completeSession(sessId) {
        const sess = DataStore.getSession(sessId);
        DataStore.updateSession(sessId, { status: 'completed' });
        const credits = Math.floor(sess.duration / 30) * 5;
        DataStore.addCredit(sess.teacherId, credits, `${sess.skill} taught`);
        this.showToast('Session complete! Credits awarded.', 'success');
        this.renderSessions();
    },

    cancelSession(sessId) { if (confirm('Cancel?')) { DataStore.updateSession(sessId, { status: 'cancelled' }); this.showToast('Session cancelled', 'success'); this.renderSessions(); } },

    rateSession(sessId) {
        const sess = DataStore.getSession(sessId);
        const otherId = sess.teacherId === this.currentUserId ? sess.learnerId : sess.teacherId;
        const otherName = sess.teacherId === this.currentUserId ? sess.learnerName : sess.teacherName;

        document.getElementById('rateWith').textContent = otherName;
        const elem = document.getElementById('rateQuality');
        let stars = '';
        for (let i = 1; i <= 5; i++) stars += `<span class="star" data-rating="${i}">★</span>`;
        elem.innerHTML = stars;

        elem.querySelectorAll('.star').forEach(star => {
            star.addEventListener('click', () => app.setRating(parseInt(star.dataset.rating)));
        });

        document.getElementById('rateReview').value = '';
        app._ratingSession = sessId;
        app._ratingOtherId = otherId;
        this.openModal('rateSessionModal');
    },

    setRating(rating) {
        document.querySelectorAll('#rateQuality .star').forEach((s, i) => {
            if (i < rating) s.classList.add('filled');
            else s.classList.remove('filled');
        });
    },

    submitReview() {
        const rating = document.querySelectorAll('#rateQuality .star.filled').length;
        const text = document.getElementById('rateReview').value;
        if (!rating) { this.showToast('Please rate', 'error'); return; }
        DataStore.createReview({
            sessionId: app._ratingSession,
            reviewerId: this.currentUserId,
            revieweeId: app._ratingOtherId,
            rating,
            text
        });
        const user = DataStore.getUser(app._ratingOtherId);
        const reviews = DataStore.getReviews().filter(r => r.revieweeId === app._ratingOtherId);
        user.rating = Math.round(reviews.reduce((s, r) => s + r.rating, 0) / reviews.length * 10) / 10;
        user.reviewCount = reviews.length;
        DataStore.saveUser(user);
        this.showToast('Review submitted!', 'success');
        this.closeModal();
        this.renderSessions();
    },

    renderCredits() {
        const credits = DataStore.getCredits().filter(c => c.userId === this.currentUserId);
        const balance = credits.reduce((s, c) => s + c.amount, 0);
        const earned = credits.filter(c => c.amount > 0).reduce((s, c) => s + c.amount, 0);
        const used = credits.filter(c => c.amount < 0).reduce((s, c) => s + Math.abs(c.amount), 0);

        document.getElementById('creditBalance').textContent = balance;
        document.getElementById('creditEarned').textContent = earned;
        document.getElementById('creditUsed').textContent = used;

        document.getElementById('creditHistory').innerHTML = credits.length === 0 ? '<tr><td colspan="3" style="text-align: center; color: var(--text-muted);">No transactions</td></tr>' : credits.slice().reverse().map(c =>
            `<tr>
                <td>${new Date(c.date).toLocaleDateString()}</td>
                <td>${c.description}</td>
                <td style="color: ${c.amount > 0 ? 'var(--success)' : 'var(--text-secondary)'}; font-weight: 600;">${c.amount > 0 ? '+' : ''}${c.amount}</td>
            </tr>`
        ).join('');
    },

    renderProgress() {
        const progs = DataStore.getProgress().filter(p => p.userId === this.currentUserId);
        const totalHours = progs.reduce((s, p) => s + (p.hours || 0), 0);

        document.getElementById('totalSkillsLearning').textContent = progs.length;
        document.getElementById('totalLearningHours').textContent = totalHours.toFixed(1);
        document.getElementById('totalSessionsDone').textContent = DataStore.getSessions().filter(s => (s.teacherId === this.currentUserId || s.learnerId === this.currentUserId) && s.status === 'completed').length;

        document.getElementById('progressContainer').innerHTML = progs.length === 0 ? '<p class="text-muted">Start learning to track progress</p>' : progs.map(p =>
            `<div class="card-compact">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
                    <div>
                        <div style="font-weight: 600;">${p.skill}</div>
                        <div class="text-muted">${p.sessions} sessions • ${p.hours.toFixed(1)} hours</div>
                    </div>
                    <span class="badge badge-level">${p.level}</span>
                </div>
                <div class="progress">
                    <div class="progress-bar" style="width: ${p.progress}%"></div>
                </div>
                <div style="display: flex; justify-content: space-between; font-size: 12px; color: var(--text-muted); margin-top: 8px;">
                    <span>${p.progress}%</span>
                    <span>${p.goal || 'Keep learning'}</span>
                </div>
            </div>`
        ).join('');
    },

    renderLeaderboard() {
        const users = DataStore.getUsers();
        const credits = DataStore.getCredits();

        const byCredits = users.map(u => ({
            user: u,
            total: credits.filter(c => c.userId === u.id && c.amount > 0).reduce((s, c) => s + c.amount, 0)
        })).sort((a, b) => b.total - a.total);

        const sessions = DataStore.getSessions().filter(s => s.status === 'completed');
        const bySessions = users.map(u => ({
            user: u,
            count: sessions.filter(s => s.teacherId === u.id || s.learnerId === u.id).length
        })).sort((a, b) => b.count - a.count);

        const byRating = users.filter(u => u.rating).sort((a, b) => b.rating - a.rating);

        document.getElementById('credits-lb').innerHTML = byCredits.map((item, i) =>
            `<div class="card-compact">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <div style="font-size: 18px; font-weight: 800; color: var(--text-muted); width: 24px;">#${i+1}</div>
                        <div>
                            <div style="font-weight: 600;">${item.user.name}</div>
                            <div class="text-muted">${item.user.department}</div>
                        </div>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-weight: 700; color: var(--accent-primary);">${item.total}</div>
                        <div class="text-muted">credits</div>
                    </div>
                </div>
            </div>`
        ).join('');

        document.getElementById('sessions-lb').innerHTML = bySessions.map((item, i) =>
            `<div class="card-compact">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <div style="font-size: 18px; font-weight: 800; color: var(--text-muted); width: 24px;">#${i+1}</div>
                        <div>
                            <div style="font-weight: 600;">${item.user.name}</div>
                            <div class="text-muted">${item.user.department}</div>
                        </div>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-weight: 700; color: var(--accent-secondary);">${item.count}</div>
                        <div class="text-muted">sessions</div>
                    </div>
                </div>
            </div>`
        ).join('');

        document.getElementById('rating-lb').innerHTML = byRating.map((u, i) =>
            `<div class="card-compact">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <div style="font-size: 18px; font-weight: 800; color: var(--text-muted); width: 24px;">#${i+1}</div>
                        <div>
                            <div style="font-weight: 600;">${u.name}</div>
                            <div class="text-muted">${u.department}</div>
                        </div>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-weight: 700; color: var(--warning);">${u.rating} ⭐</div>
                        <div class="text-muted">${u.reviewCount} reviews</div>
                    </div>
                </div>
            </div>`
        ).join('');
    },

    renderProfile() {
        const u = DataStore.getUser(this.currentUserId);
        const reviews = DataStore.getReviews().filter(r => r.revieweeId === this.currentUserId);

        document.getElementById('profileContent').innerHTML = `
            <div class="card">
                <div style="display: flex; gap: 16px; align-items: flex-start; margin-bottom: 20px;">
                    <div style="width: 80px; height: 80px; border-radius: 50%; background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary)); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 28px; color: white;">${u.avatar}</div>
                    <div>
                        <h2 style="margin-bottom: 4px;">${u.name}</h2>
                        <p class="text-muted">${u.department} • Year ${u.year}</p>
                        <p style="color: var(--text-secondary); margin: 8px 0;">${u.bio}</p>
                        <div style="display: flex; gap: 16px; margin-top: 12px;">
                            <div>
                                <div style="font-weight: 700; color: var(--warning);">${u.rating || '--'}</div>
                                <div class="text-muted">${u.reviewCount} reviews</div>
                            </div>
                            <div>
                                <div style="font-weight: 700; color: var(--accent-primary);">${u.sessions}</div>
                                <div class="text-muted">sessions</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="card">
                <h3>Can Teach</h3>
                <div style="margin-top: 12px;">${u.canTeach.map(s => `<span class="skill-tag">${s}</span>`).join('')}</div>
            </div>

            <div class="card">
                <h3>Wants to Learn</h3>
                <div style="margin-top: 12px;">${u.wantLearn.map(s => `<span class="skill-tag">${s}</span>`).join('')}</div>
            </div>

            ${reviews.length > 0 ? `
                <div class="card">
                    <h3>Reviews</h3>
                    ${reviews.slice(0, 3).map(r => `
                        <div style="padding: 12px; background: var(--bg-secondary); border-radius: 8px; margin-top: 12px;">
                            <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                                <span style="font-weight: 600;">${DataStore.getUser(r.reviewerId).name}</span>
                                <span style="color: var(--warning);">★ ${r.rating}</span>
                            </div>
                            <p style="margin: 0; font-size: 13px; color: var(--text-secondary);">${r.text}</p>
                        </div>
                    `).join('')}
                </div>
            ` : ''}
        `;
    },

    viewProfile(userId) {
        const u = DataStore.getUser(userId);

        const modal = document.createElement('div');
        modal.className = 'modal-overlay active';
        modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
        modal.innerHTML = `
            <div class="modal">
                <div class="modal-header">
                    <h2>${u.name}</h2>
                    <button class="modal-close btn-close-modal">×</button>
                </div>
                <div class="modal-body">
                    <div style="display: flex; gap: 14px; margin-bottom: 20px;">
                        <div style="width: 56px; height: 56px; border-radius: 50%; background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary)); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 20px; color: white;">${u.avatar}</div>
                        <div>
                            <p class="text-muted">${u.department} • Year ${u.year}</p>
                            <p style="color: var(--text-secondary);">${u.bio}</p>
                            <div style="display: flex; gap: 16px; margin-top: 8px;">
                                <div>
                                    <div style="font-weight: 700; color: var(--warning);">${u.rating}</div>
                                    <div class="text-muted">${u.reviewCount} reviews</div>
                                </div>
                                <div>
                                    <div style="font-weight: 700;">${u.sessions}</div>
                                    <div class="text-muted">sessions</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <h3>Can Teach</h3>
                    <div style="margin-bottom: 16px;">${u.canTeach.map(s => `<span class="skill-tag">${s}</span>`).join('')}</div>
                    <h3>Wants to Learn</h3>
                    <div>${u.wantLearn.map(s => `<span class="skill-tag">${s}</span>`).join('')}</div>
                </div>
                <div class="modal-footer">
                    <button class="btn-secondary btn-close-modal">Close</button>
                    <button class="btn-primary btn-request-profile" data-user-id="${userId}">Request</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        modal.querySelectorAll('.btn-close-modal').forEach(btn => {
            btn.addEventListener('click', () => modal.remove());
        });
        modal.querySelector('.btn-request-profile').addEventListener('click', () => {
            modal.remove();
            app.initiateSwapRequest(userId);
        });
    },

    saveProfile() {
        const u = DataStore.getUser(this.currentUserId);
        u.name = document.getElementById('editName').value;
        u.bio = document.getElementById('editBio').value;
        u.department = document.getElementById('editDepartment').value;
        u.year = document.getElementById('editYear').value;
        u.canTeach = document.getElementById('editCanTeach').value.split(',').map(s => s.trim()).filter(s => s);
        u.wantLearn = document.getElementById('editWantLearn').value.split(',').map(s => s.trim()).filter(s => s);

        DataStore.saveUser(u);
        this.showToast('Profile saved!', 'success');
        this.closeModal();
        this.renderProfile();
    },

    renderNotifications() {
        const notifs = DataStore.getNotifications().filter(n => n.userId === this.currentUserId).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        document.getElementById('notificationsContainer').innerHTML = notifs.length === 0 ? '<p class="text-muted">No notifications</p>' : notifs.map(n =>
            `<div class="card-compact btn-mark-read" style="cursor: pointer;" data-notif-id="${n.id}">
                <div style="opacity: ${n.read ? 0.6 : 1};">
                    <div style="font-weight: 600; margin-bottom: 4px;">${n.title}</div>
                    <div class="text-muted">${n.message}</div>
                </div>
            </div>`
        ).join('');

        document.querySelectorAll('.btn-mark-read').forEach(el => {
            el.addEventListener('click', () => {
                app.markNotificationRead(el.dataset.notifId);
            });
        });
    },

    markNotificationRead(id) {
        DataStore.markNotificationRead(id);
        this.renderNotifications();
    },

    renderAdmin() {
        const users = DataStore.getUsers();
        const reqs = DataStore.getRequests();
        const sessions = DataStore.getSessions();
        const credits = DataStore.getCredits();

        const totalSkills = users.reduce((s, u) => s + u.canTeach.length, 0);
        const completedSess = sessions.filter(s => s.status === 'completed').length;
        const totalCredits = credits.reduce((s, c) => s + c.amount, 0);

        document.getElementById('adminTotalStudents').textContent = users.length;
        document.getElementById('adminActiveSwaps').textContent = reqs.filter(r => r.status === 'accepted').length;

        document.getElementById('stat-total-students').textContent = users.length;
        document.getElementById('stat-total-skills').textContent = totalSkills;
        document.getElementById('stat-completed-sessions').textContent = completedSess;
        document.getElementById('stat-credits-exchanged').textContent = totalCredits;
    },

    openModal(id) { document.getElementById(id).classList.add('active'); },
    closeModal() { document.querySelectorAll('.modal-overlay.active').forEach(m => m.classList.remove('active')); },

    switchTab(e, tabId) {
        const tabsContainer = e.target.closest('.tabs');
        tabsContainer.querySelectorAll('.tab-button').forEach(t => t.classList.remove('active'));
        e.target.classList.add('active');

        const viewSection = tabsContainer.closest('.view-section') || tabsContainer.parentElement;
        viewSection.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
        document.getElementById(tabId).classList.add('active');
    },

    showToast(msg, type = 'success') {
        const container = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = msg;
        container.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    },

    resetDemoData() {
        if (!confirm('Reset all data?')) return;
        DataStore.resetData();
        this.init();
        this.showToast('Data reset!', 'success');
    },

    // Helper to bind click handlers to dynamically rendered buttons
    _bindButtons(selector, handler) {
        document.querySelectorAll(selector).forEach(btn => {
            btn.addEventListener('click', () => handler(btn.dataset.userId));
        });
    }
};

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
    app.init();

    // Sidebar navigation
    document.querySelectorAll('.nav-item[data-view]').forEach(item => {
        item.addEventListener('click', () => app.navigate(item.dataset.view));
    });

    // Sidebar switch button
    document.getElementById('btnSwitchStudent')?.addEventListener('click', () => app.switchStudent());

    // Header notifications button
    document.getElementById('btnNotifications')?.addEventListener('click', () => app.navigate('notifications'));

    // Dashboard buttons
    document.getElementById('btnFindMatch')?.addEventListener('click', () => app.navigate('matches'));
    document.getElementById('btnPostSkill')?.addEventListener('click', () => app.navigate('board'));

    // Board search and filters
    document.getElementById('boardSearch')?.addEventListener('keyup', () => app.filterBoard());
    document.getElementById('departmentFilter')?.addEventListener('change', () => app.filterBoard());
    document.getElementById('availabilityFilter')?.addEventListener('change', () => app.filterBoard());

    // Match sort buttons
    document.querySelectorAll('.btn-sort-match').forEach(btn => {
        btn.addEventListener('click', () => app.sortMatches(btn.dataset.sort));
    });

    // Request tabs
    document.querySelectorAll('.btn-tab-request').forEach(btn => {
        btn.addEventListener('click', (e) => app.switchTab(e, btn.dataset.tab));
    });

    // Session tabs
    document.querySelectorAll('.btn-tab-session').forEach(btn => {
        btn.addEventListener('click', (e) => app.switchTab(e, btn.dataset.tab));
    });

    // Leaderboard tabs
    document.querySelectorAll('.btn-tab-leaderboard').forEach(btn => {
        btn.addEventListener('click', (e) => app.switchTab(e, btn.dataset.tab));
    });

    // Modal close buttons (static modals)
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) app.closeModal();
        });
    });

    document.querySelectorAll('.btn-close-modal-static').forEach(btn => {
        btn.addEventListener('click', () => app.closeModal());
    });

    // Request swap modal
    document.getElementById('btnSubmitSwap')?.addEventListener('click', () => app.submitSwapRequest());

    // Edit profile modal
    document.getElementById('btnEditProfile')?.addEventListener('click', () => {
        const u = DataStore.getUser(app.currentUserId);
        document.getElementById('editName').value = u.name;
        document.getElementById('editBio').value = u.bio;
        document.getElementById('editDepartment').value = u.department;
        document.getElementById('editYear').value = u.year;
        document.getElementById('editCanTeach').value = u.canTeach.join(', ');
        document.getElementById('editWantLearn').value = u.wantLearn.join(', ');
        app.openModal('editProfileModal');
    });
    document.getElementById('btnSaveProfile')?.addEventListener('click', () => app.saveProfile());

    // Schedule session modal
    document.getElementById('btnScheduleSession')?.addEventListener('click', () => app.openModal('scheduleSessionModal'));
    document.getElementById('btnSubmitSchedule')?.addEventListener('click', () => app.scheduleSession());

    // Rate session modal
    document.getElementById('btnSubmitReview')?.addEventListener('click', () => app.submitReview());

    // Admin reset
    document.getElementById('btnResetData')?.addEventListener('click', () => app.resetDemoData());

    // Chat send
    document.getElementById('btnSendMessage')?.addEventListener('click', () => app.sendMessage());
    document.getElementById('messageInput')?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') app.sendMessage();
    });

    // Event delegation for dynamic button clicks in request lists
    document.addEventListener('click', (e) => {
        const target = e.target.closest('[data-req-id]');
        if (target) {
            const reqId = target.dataset.reqId;
            if (target.classList.contains('btn-accept')) app.acceptRequest(reqId);
            else if (target.classList.contains('btn-reject')) app.rejectRequest(reqId);
            else if (target.classList.contains('btn-cancel')) app.cancelRequest(reqId);
        }

        const sessTarget = e.target.closest('[data-sess-id]');
        if (sessTarget) {
            const sessId = sessTarget.dataset.sessId;
            if (sessTarget.classList.contains('btn-complete')) app.completeSession(sessId);
            else if (sessTarget.classList.contains('btn-cancel-sess')) app.cancelSession(sessId);
            else if (sessTarget.classList.contains('btn-review')) app.rateSession(sessId);
        }
    });
});
