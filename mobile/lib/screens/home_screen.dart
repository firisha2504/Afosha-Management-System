import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/locale_provider.dart';
import '../providers/auth_provider.dart';
import '../services/api_service.dart';
import '../config/api_config.dart';
import 'profile_screen.dart';
import 'contributions_screen.dart';
import 'notifications_screen.dart';
import 'more_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});
  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int currentIndex = 0;
  Map<String, dynamic>? _dashboard;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadDashboard();
  }

  Future<void> _loadDashboard() async {
    setState(() => _loading = true);
    try {
      final response = await ApiService.get('/dashboard/member');
      if (mounted) setState(() => _dashboard = response['data']);
    } catch (_) {}
    if (mounted) setState(() => _loading = false);
  }

  @override
  Widget build(BuildContext context) {
    final locale = context.watch<LocaleProvider>();
    final isOm = locale.locale.languageCode == 'om';

    final screens = [
      _DashboardTab(
          dashboard: _dashboard,
          isOm: isOm,
          loading: _loading,
          onRefresh: _loadDashboard),
      const ContributionsScreen(),
      const NotificationsScreen(),
      const MoreScreen(),
      const ProfileScreen(),
    ];

    return Scaffold(
      body: screens[currentIndex],
      bottomNavigationBar: NavigationBar(
        selectedIndex: currentIndex,
        onDestinationSelected: (i) => setState(() => currentIndex = i),
        backgroundColor: Colors.white,
        elevation: 8,
        shadowColor: Colors.black12,
        destinations: [
          NavigationDestination(
              icon: const Icon(Icons.home_outlined),
              selectedIcon: const Icon(Icons.home),
              label: isOm ? 'Mana' : 'Home'),
          NavigationDestination(
              icon: const Icon(Icons.payment_outlined),
              selectedIcon: const Icon(Icons.payment),
              label: isOm ? 'Kaffaltii' : 'Payments'),
          NavigationDestination(
              icon: const Icon(Icons.notifications_outlined),
              selectedIcon: const Icon(Icons.notifications),
              label: isOm ? 'Beeksisa' : 'Alerts'),
          NavigationDestination(
              icon: const Icon(Icons.more_horiz),
              selectedIcon: const Icon(Icons.more_horiz),
              label: isOm ? 'Biroo' : 'More'),
          NavigationDestination(
              icon: const Icon(Icons.person_outlined),
              selectedIcon: const Icon(Icons.person),
              label: isOm ? 'Profaayil' : 'Profile'),
        ],
      ),
    );
  }
}

// ── Dashboard Tab ──────────────────────────────────────────────────────────────
class _DashboardTab extends StatelessWidget {
  final Map<String, dynamic>? dashboard;
  final bool isOm;
  final bool loading;
  final Future<void> Function() onRefresh;

  const _DashboardTab({
    this.dashboard,
    required this.isOm,
    required this.loading,
    required this.onRefresh,
  });

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthProvider>().user;
    final locale = context.watch<LocaleProvider>();
    final primary = const Color(0xFF166534);
    final gold = const Color(0xFFD97706);

    return Scaffold(
      body: RefreshIndicator(
        onRefresh: onRefresh,
        color: primary,
        child: CustomScrollView(
          slivers: [
            // ── App Bar ──
            SliverAppBar(
              expandedHeight: 160,
              pinned: true,
              backgroundColor: primary,
              actions: [
                IconButton(
                  icon: const Icon(Icons.language, color: Colors.white),
                  onPressed: () => locale.toggleLocale(),
                ),
                const SizedBox(width: 4),
              ],
              flexibleSpace: FlexibleSpaceBar(
                background: Container(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                      colors: [
                        const Color(0xFF14532D),
                        const Color(0xFF166634),
                        const Color(0xFF15803D),
                      ],
                    ),
                  ),
                  child: SafeArea(
                    child: Padding(
                      padding: const EdgeInsets.fromLTRB(20, 12, 20, 20),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisAlignment: MainAxisAlignment.end,
                        children: [
                          Row(
                            children: [
                              // Avatar
                              Builder(
                                builder: (context) {
                                  final pic = dashboard?['profilePicture'] as String?;
                                  final picUrl = pic != null && pic.isNotEmpty
                                      ? '${ApiConfig.baseUrl.replaceAll('/api', '')}$pic'
                                      : null;
                                  final initial = (dashboard?['fullName'] as String? ??
                                          user?.phone ?? 'U')
                                      .substring(0, 1)
                                      .toUpperCase();
                                  return Container(
                                    width: 44,
                                    height: 44,
                                    decoration: BoxDecoration(
                                      shape: BoxShape.circle,
                                      border: Border.all(
                                          color: Colors.white.withOpacity(0.3),
                                          width: 2),
                                    ),
                                    child: ClipOval(
                                      child: picUrl != null
                                          ? Image.network(
                                              picUrl,
                                              fit: BoxFit.cover,
                                              errorBuilder: (_, __, ___) => Container(
                                                decoration: BoxDecoration(
                                                  gradient: LinearGradient(
                                                      colors: [gold, const Color(0xFFF59E0B)]),
                                                ),
                                                child: Center(
                                                  child: Text(initial,
                                                      style: const TextStyle(
                                                          color: Color(0xFF14532D),
                                                          fontWeight: FontWeight.bold,
                                                          fontSize: 18)),
                                                ),
                                              ),
                                            )
                                          : Container(
                                              decoration: BoxDecoration(
                                                gradient: LinearGradient(
                                                    colors: [gold, const Color(0xFFF59E0B)]),
                                              ),
                                              child: Center(
                                                child: Text(initial,
                                                    style: const TextStyle(
                                                        color: Color(0xFF14532D),
                                                        fontWeight: FontWeight.bold,
                                                        fontSize: 18)),
                                              ),
                                            ),
                                    ),
                                  );
                                },
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      isOm ? 'Nagaan Dhufta!' : 'Welcome back!',
                                      style: TextStyle(
                                          color: Colors.white.withOpacity(0.8),
                                          fontSize: 12),
                                    ),
                                    Text(
                                      dashboard?['fullName'] ??
                                          user?.phone ??
                                          '',
                                      style: const TextStyle(
                                          color: Colors.white,
                                          fontWeight: FontWeight.bold,
                                          fontSize: 16),
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ),

            if (loading)
              const SliverFillRemaining(
                child: Center(child: CircularProgressIndicator()),
              )
            else
              SliverPadding(
                padding: const EdgeInsets.all(16),
                sliver: SliverList(
                  delegate: SliverChildListDelegate([

                    // ── Quick Stats Row ──
                    _QuickStatsRow(dashboard: dashboard, isOm: isOm, primary: primary, gold: gold),
                    const SizedBox(height: 20),

                    // ── Financial Overview Cards ──
                    _SectionTitle(title: isOm ? 'Haala Maallaqaa' : 'Financial Overview'),
                    const SizedBox(height: 10),
                    Row(children: [
                      Expanded(child: _FinanceCard(
                        title: isOm ? 'Hanga Hafe' : 'Outstanding',
                        value: '${_fmt(dashboard?['outstandingBalance'])} ETB',
                        icon: Icons.account_balance_wallet_outlined,
                        color: const Color(0xFFEA580C),
                      )),
                      const SizedBox(width: 10),
                      Expanded(child: _FinanceCard(
                        title: isOm ? 'Kaffaltii' : 'Contributions',
                        value: '${_fmt(dashboard?['totalContributions'])} ETB',
                        icon: Icons.payments_outlined,
                        color: primary,
                      )),
                    ]),
                    const SizedBox(height: 10),
                    Row(children: [
                      Expanded(child: _FinanceCard(
                        title: isOm ? 'Adabbii' : 'Penalties',
                        value: '${_fmt(dashboard?['totalPenalties'])} ETB',
                        icon: Icons.warning_amber_outlined,
                        color: const Color(0xFFDC2626),
                      )),
                    ]),
                    const SizedBox(height: 20),

                    // ── Attendance ──
                    _SectionTitle(title: isOm ? 'Haala Argamaa' : 'Attendance'),
                    const SizedBox(height: 10),
                    _AttendanceCard(
                      percentage: (dashboard?['attendancePercentage'] as num?)?.toInt() ?? 0,
                      isOm: isOm,
                      primary: primary,
                    ),
                    const SizedBox(height: 20),

                    // ── Quick Actions ──
                    _SectionTitle(title: isOm ? 'Gochaa Hatattamaa' : 'Quick Actions'),
                    const SizedBox(height: 10),
                    _QuickActions(isOm: isOm, primary: primary, gold: gold),
                    const SizedBox(height: 20),

                    // ── Upcoming Meetings ──
                    if (dashboard?['upcomingMeetings'] != null &&
                        (dashboard!['upcomingMeetings'] as List).isNotEmpty) ...[
                      _SectionTitle(title: isOm ? 'Walga\'ii Dhufaa Jiran' : 'Upcoming Meetings'),
                      const SizedBox(height: 10),
                      ...(dashboard!['upcomingMeetings'] as List).map((m) =>
                          _MeetingCard(meeting: m, isOm: isOm, primary: primary)),
                      const SizedBox(height: 20),
                    ],

                    // ── Recent Notifications ──
                    if (dashboard?['recentNotifications'] != null &&
                        (dashboard!['recentNotifications'] as List).isNotEmpty) ...[
                      _SectionTitle(title: isOm ? 'Beeksisa Dhiyoo' : 'Recent Notifications'),
                      const SizedBox(height: 10),
                      ...(dashboard!['recentNotifications'] as List)
                          .take(3)
                          .map((n) => _NotifCard(notif: n, isOm: isOm)),
                    ],

                    const SizedBox(height: 24),
                  ]),
                ),
              ),
          ],
        ),
      ),
    );
  }

  static String _fmt(dynamic val) {
    if (val == null) return '0';
    final n = num.tryParse(val.toString()) ?? 0;
    return n.toStringAsFixed(0);
  }
}

// ── Quick Stats Row ──────────────────────────────────────────────────────────
class _QuickStatsRow extends StatelessWidget {
  final Map<String, dynamic>? dashboard;
  final bool isOm;
  final Color primary;
  final Color gold;

  const _QuickStatsRow({this.dashboard, required this.isOm, required this.primary, required this.gold});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [primary.withOpacity(0.08), gold.withOpacity(0.05)],
        ),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: primary.withOpacity(0.12)),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [
          _QuickStat(label: isOm ? 'ID' : 'Member ID', value: dashboard?['memberId'] ?? '-', color: primary),
          _Divider(),
          _QuickStat(label: isOm ? 'Haala' : 'Status', value: dashboard?['status'] ?? 'APPROVED', color: Colors.green.shade700),
          _Divider(),
          _QuickStat(label: isOm ? 'Argama' : 'Attendance', value: '${dashboard?['attendancePercentage'] ?? 0}%', color: gold),
        ],
      ),
    );
  }
}

class _Divider extends StatelessWidget {
  @override
  Widget build(BuildContext context) =>
      Container(width: 1, height: 32, color: Colors.grey.shade200);
}

class _QuickStat extends StatelessWidget {
  final String label;
  final String value;
  final Color color;

  const _QuickStat({required this.label, required this.value, required this.color});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text(value, style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: color)),
        const SizedBox(height: 2),
        Text(label, style: const TextStyle(fontSize: 10, color: Colors.grey)),
      ],
    );
  }
}

// ── Finance Card ──────────────────────────────────────────────────────────────
class _FinanceCard extends StatelessWidget {
  final String title;
  final String value;
  final IconData icon;
  final Color color;

  const _FinanceCard({required this.title, required this.value, required this.icon, required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Colors.grey.shade100),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 8, offset: const Offset(0, 2))],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 34, height: 34,
            decoration: BoxDecoration(color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(8)),
            child: Icon(icon, color: color, size: 18),
          ),
          const SizedBox(height: 10),
          Text(value, style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: color)),
          const SizedBox(height: 2),
          Text(title, style: const TextStyle(fontSize: 11, color: Colors.grey), maxLines: 1, overflow: TextOverflow.ellipsis),
        ],
      ),
    );
  }
}

// ── Attendance Card ───────────────────────────────────────────────────────────
class _AttendanceCard extends StatelessWidget {
  final int percentage;
  final bool isOm;
  final Color primary;

  const _AttendanceCard({required this.percentage, required this.isOm, required this.primary});

  @override
  Widget build(BuildContext context) {
    final color = percentage >= 80 ? Colors.green.shade600
        : percentage >= 60 ? Colors.orange.shade600
        : Colors.red.shade600;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Colors.grey.shade100),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 8, offset: const Offset(0, 2))],
      ),
      child: Row(
        children: [
          // Progress circle
          SizedBox(
            width: 64, height: 64,
            child: Stack(
              alignment: Alignment.center,
              children: [
                CircularProgressIndicator(
                  value: percentage / 100,
                  backgroundColor: Colors.grey.shade100,
                  valueColor: AlwaysStoppedAnimation<Color>(color),
                  strokeWidth: 6,
                ),
                Text('$percentage%', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: color)),
              ],
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(isOm ? 'Argama Waliigalaa' : 'Overall Attendance',
                    style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                const SizedBox(height: 4),
                Text(
                  percentage >= 80
                      ? (isOm ? 'Baay\'ee gaarii!' : 'Excellent attendance!')
                      : percentage >= 60
                          ? (isOm ? 'Garii, itti fufaa!' : 'Good, keep it up!')
                          : (isOm ? 'Argama fooyyessaa!' : 'Needs improvement'),
                  style: TextStyle(fontSize: 12, color: color),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ── Quick Actions ─────────────────────────────────────────────────────────────
class _QuickActions extends StatelessWidget {
  final bool isOm;
  final Color primary;
  final Color gold;

  const _QuickActions({required this.isOm, required this.primary, required this.gold});

  @override
  Widget build(BuildContext context) {
    final actions = [
      _Action(icon: Icons.payment_outlined, label: isOm ? 'Kaffaltii' : 'Payments', color: primary, index: 1),
      _Action(icon: Icons.receipt_long_outlined, label: isOm ? 'Herrega' : 'Receipts', color: gold, index: 4),
      _Action(icon: Icons.event_available_outlined, label: isOm ? 'Argama' : 'Attendance', color: Colors.teal.shade600, index: 4),
    ];

    return GridView.count(
      crossAxisCount: 4,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      mainAxisSpacing: 8,
      crossAxisSpacing: 8,
      children: actions
          .map((a) => _ActionTile(
                action: a,
                onTap: () {
                  // Find the home screen state and change tab
                  final state = context.findAncestorStateOfType<_HomeScreenState>();
                  if (state != null) {
                    state.setState(() {
                      state.currentIndex = a.index;
                    });
                  }
                },
              ))
          .toList(),
    );
  }
}

class _Action {
  final IconData icon;
  final String label;
  final Color color;
  final int index; // bottom nav index to jump to

  const _Action({required this.icon, required this.label, required this.color, required this.index});
}

class _ActionTile extends StatelessWidget {
  final _Action action;
  final VoidCallback onTap;

  const _ActionTile({required this.action, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        children: [
          Container(
            width: 52, height: 52,
            decoration: BoxDecoration(
              color: action.color.withOpacity(0.1),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: action.color.withOpacity(0.15)),
            ),
            child: Icon(action.icon, color: action.color, size: 24),
          ),
          const SizedBox(height: 6),
          Text(action.label, style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w500),
              textAlign: TextAlign.center, maxLines: 1, overflow: TextOverflow.ellipsis),
        ],
      ),
    );
  }
}

// ── Meeting Card ──────────────────────────────────────────────────────────────
class _MeetingCard extends StatelessWidget {
  final Map<String, dynamic> meeting;
  final bool isOm;
  final Color primary;

  const _MeetingCard({required this.meeting, required this.isOm, required this.primary});

  @override
  Widget build(BuildContext context) {
    final date = DateTime.tryParse(meeting['meetingDate'] ?? '');
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Colors.grey.shade100),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 6)],
      ),
      child: Row(
        children: [
          // Date badge
          Container(
            width: 48, height: 52,
            decoration: BoxDecoration(
              color: primary.withOpacity(0.08),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  date != null ? _monthName(date.month) : '-',
                  style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: primary),
                ),
                Text(
                  date != null ? date.day.toString() : '-',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: primary, height: 1.1),
                ),
              ],
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(meeting['title'] ?? '', style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                if (meeting['meetingTime'] != null)
                  Text(meeting['meetingTime'], style: const TextStyle(fontSize: 12, color: Colors.grey)),
                if (meeting['location'] != null)
                  Row(children: [
                    const Icon(Icons.location_on_outlined, size: 12, color: Colors.grey),
                    const SizedBox(width: 2),
                    Text(meeting['location'], style: const TextStyle(fontSize: 11, color: Colors.grey)),
                  ]),
              ],
            ),
          ),
        ],
      ),
    );
  }

  static String _monthName(int m) =>
      ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'][m - 1];
}

// ── Notification Card ─────────────────────────────────────────────────────────
class _NotifCard extends StatelessWidget {
  final Map<String, dynamic> notif;
  final bool isOm;

  const _NotifCard({required this.notif, required this.isOm});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey.shade100),
      ),
      child: Row(
        children: [
          Container(
            width: 36, height: 36,
            decoration: BoxDecoration(color: Colors.blue.shade50, borderRadius: BorderRadius.circular(10)),
            child: Icon(Icons.notifications_outlined, color: Colors.blue.shade600, size: 18),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  isOm ? (notif['titleOm'] ?? notif['title'] ?? '') : (notif['title'] ?? ''),
                  style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
                  maxLines: 1, overflow: TextOverflow.ellipsis,
                ),
                Text(
                  isOm ? (notif['messageOm'] ?? notif['message'] ?? '') : (notif['message'] ?? ''),
                  style: const TextStyle(fontSize: 11, color: Colors.grey),
                  maxLines: 2, overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ── Section Title ─────────────────────────────────────────────────────────────
class _SectionTitle extends StatelessWidget {
  final String title;
  const _SectionTitle({required this.title});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
        const SizedBox(width: 8),
        Expanded(child: Divider(color: Colors.grey.shade200)),
      ],
    );
  }
}
