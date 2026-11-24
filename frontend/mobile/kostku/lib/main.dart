import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'api.dart';

const Color kBrand = Color(0xFF176B78);
const Color kBrandDark = Color(0xFF0F5560);
const Color kBrandLight = Color(0xFF2A97A5);
const Color kAccent = Color(0xFFF47B20);
const Color kCream = Color(0xFFFDF3E9);

void main() {
  runApp(const KostkuApp());
}

class MyApp extends KostkuApp {
  const MyApp({super.key});
}

class KostkuApp extends StatelessWidget {
  const KostkuApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'KostKu',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        scaffoldBackgroundColor: kCream,
        colorScheme: ColorScheme.fromSeed(
          seedColor: kBrand,
          primary: kBrand,
          secondary: kAccent,
          surface: Colors.white,
        ),
      ),
      // Bungkus agar tetap proporsional layaknya layar HP meski dibuka di Chrome
      builder: (context, child) {
        return ColoredBox(
          color: const Color(0xFFEFE5D8),
          child: Center(
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 430),
              child: ClipRect(child: child ?? const SizedBox.shrink()),
            ),
          ),
        );
      },
      home: const LandingScreen(),
    );
  }
}

class LandingScreen extends StatefulWidget {
  const LandingScreen({super.key});

  @override
  State<LandingScreen> createState() => _LandingScreenState();
}

class _LandingScreenState extends State<LandingScreen> {
  int _navIndex = 0;

  KosInfo? _kos;
  List<KamarModel> _semuaKamar = const [];
  bool _memuat = true;
  String? _galat;

  // Filter & pencarian
  final TextEditingController _kataCtrl = TextEditingController();
  String _kata = '';
  int _hargaMaks = 0;
  String _tipe = '';
  bool _termurah = false;

  // Auth state
  UserModel? _user;
  bool _isRegisterMode = false;
  bool _authMemuat = false;
  String? _authGalat;
  final TextEditingController _namaCtrl = TextEditingController();
  final TextEditingController _noHpCtrl = TextEditingController();
  final TextEditingController _emailCtrl = TextEditingController();
  final TextEditingController _passCtrl = TextEditingController();
  String _roleRegister = 'penghuni';

  final ScrollController _berandaScroll = ScrollController();
  final GlobalKey _kamarSectionKey = GlobalKey();

  @override
  void initState() {
    super.initState();
    _muatData();
  }

  @override
  void dispose() {
    _kataCtrl.dispose();
    _namaCtrl.dispose();
    _noHpCtrl.dispose();
    _emailCtrl.dispose();
    _passCtrl.dispose();
    _berandaScroll.dispose();
    super.dispose();
  }

  Future<void> _muatData() async {
    setState(() {
      _memuat = true;
      _galat = null;
    });
    try {
      final results = await Future.wait([
        KostkuApi.getKos(),
        KostkuApi.getKamarTersedia(),
      ]);
      if (!mounted) return;
      setState(() {
        _kos = results[0] as KosInfo;
        _semuaKamar = results[1] as List<KamarModel>;
        _memuat = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _galat = e.toString().replaceFirst('Exception: ', '');
        _memuat = false;
      });
    }
  }

  List<String> get _daftarTipe {
    final s = <String>{};
    for (final k in _semuaKamar) {
      if (k.tipe.isNotEmpty) s.add(k.tipe);
    }
    return s.toList();
  }

  List<int> get _daftarHarga {
    final s = <int>{};
    for (final k in _semuaKamar) {
      if (k.harga > 0) s.add(k.harga);
    }
    final list = s.toList()..sort();
    return list;
  }

  bool get _terfilter =>
      _kata.trim().isNotEmpty || _hargaMaks > 0 || _tipe.isNotEmpty || _termurah;

  List<KamarModel> get _hasilKamar {
    final q = _kata.trim().toLowerCase();
    var r = _semuaKamar.where((k) {
      if (_tipe.isNotEmpty && k.tipe != _tipe) return false;
      if (_hargaMaks > 0 && k.harga > _hargaMaks) return false;
      if (q.isNotEmpty) {
        final teks = [
          k.kode,
          k.tipe,
          k.deskripsi,
          'lantai ${k.lantai}',
          _kos?.alamat ?? '',
          ...k.fasilitas,
        ].join(' ').toLowerCase();
        if (!teks.contains(q)) return false;
      }
      return true;
    }).toList();
    if (_termurah) {
      r.sort((a, b) => a.harga.compareTo(b.harga));
    }
    return r;
  }

  void _resetFilter() {
    setState(() {
      _kata = '';
      _kataCtrl.clear();
      _hargaMaks = 0;
      _tipe = '';
      _termurah = false;
    });
  }

  void _toast(String msg, {bool error = false}) {
    if (!mounted) return;
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(
        SnackBar(
          content: Text(msg, style: const TextStyle(fontSize: 12.5)),
          backgroundColor: error ? Colors.red.shade700 : Colors.grey.shade900,
          behavior: SnackBarBehavior.floating,
        ),
      );
  }

  Future<void> _salinTeks(String label, String nilai) async {
    await Clipboard.setData(ClipboardData(text: nilai));
    _toast('$label disalin: $nilai');
  }

  Future<void> _bukaDetailKamar(KamarModel awal) async {
    KamarModel detail = awal;
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      constraints: const BoxConstraints(maxWidth: 430),
      builder: (ctx) {
        bool memuatDetail = true;
        bool started = false;
        return StatefulBuilder(
          builder: (ctx, setModalState) {
            if (!started) {
              started = true;
              KostkuApi.getKamarDetail(awal.id).then((d) {
                if (ctx.mounted) {
                  setModalState(() {
                    detail = d;
                    memuatDetail = false;
                  });
                }
              }).catchError((_) {
                if (ctx.mounted) {
                  setModalState(() => memuatDetail = false);
                }
              });
            }

            final wa = (detail.kontakPengelola?['whatsapp'] ?? _kos?.whatsapp ?? '').toString();
            final telp = (detail.kontakPengelola?['telepon'] ?? _kos?.telepon ?? '').toString();
            final aturan = detail.aturanKost.isNotEmpty ? detail.aturanKost : (_kos?.aturan ?? const []);

            return Container(
              constraints: BoxConstraints(
                maxHeight: MediaQuery.of(ctx).size.height * 0.85,
              ),
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Stack(
                    children: [
                      ClipRRect(
                        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
                        child: SizedBox(
                          height: 185,
                          width: double.infinity,
                          child: detail.foto.isNotEmpty
                              ? Image.network(
                                  KostkuApi.aset(detail.foto.first),
                                  fit: BoxFit.cover,
                                  errorBuilder: (_, __, ___) => _placeholderFoto(),
                                )
                              : _placeholderFoto(),
                        ),
                      ),
                      Positioned(
                        top: 10,
                        right: 10,
                        child: Material(
                          color: Colors.white.withValues(alpha: 0.92),
                          shape: const CircleBorder(),
                          child: InkWell(
                            customBorder: const CircleBorder(),
                            onTap: () => Navigator.pop(ctx),
                            child: const Padding(
                              padding: EdgeInsets.all(6),
                              child: Icon(Icons.close, size: 18),
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                  Flexible(
                    child: SingleChildScrollView(
                      padding: const EdgeInsets.fromLTRB(16, 14, 16, 12),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      'Kamar ${detail.kode} · ${detail.tipe}',
                                      style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w800),
                                    ),
                                    const SizedBox(height: 2),
                                    Text(
                                      'Lantai ${detail.lantai} · ${detail.luas}',
                                      style: const TextStyle(fontSize: 12, color: Colors.black54),
                                    ),
                                  ],
                                ),
                              ),
                              Text(
                                '${KostkuApi.rupiah(detail.harga)}/bln',
                                style: const TextStyle(
                                  fontSize: 15,
                                  fontWeight: FontWeight.w800,
                                  color: kBrand,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 10),
                          Text(
                            detail.deskripsi,
                            style: const TextStyle(fontSize: 13, color: Colors.black87, height: 1.4),
                          ),
                          const SizedBox(height: 14),
                          const Text('Fasilitas', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
                          const SizedBox(height: 6),
                          Wrap(
                            spacing: 6,
                            runSpacing: 6,
                            children: detail.fasilitas
                                .map(
                                  (f) => Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                                    decoration: BoxDecoration(
                                      color: kCream,
                                      borderRadius: BorderRadius.circular(999),
                                    ),
                                    child: Text(f, style: const TextStyle(fontSize: 11.5, fontWeight: FontWeight.w600)),
                                  ),
                                )
                                .toList(),
                          ),
                          if (aturan.isNotEmpty) ...[
                            const SizedBox(height: 14),
                            const Text('Aturan Kos', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
                            const SizedBox(height: 6),
                            ...aturan.map(
                              (a) => Padding(
                                padding: const EdgeInsets.only(bottom: 4),
                                child: Row(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    const Text('• ', style: TextStyle(fontWeight: FontWeight.bold, color: kBrand)),
                                    Expanded(
                                      child: Text(a, style: const TextStyle(fontSize: 12, color: Colors.black54)),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ],
                          if (memuatDetail)
                            const Padding(
                              padding: EdgeInsets.only(top: 6),
                              child: Text('Memuat detail…', style: TextStyle(fontSize: 11, color: Colors.black38)),
                            ),
                        ],
                      ),
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.fromLTRB(16, 10, 16, 16),
                    decoration: const BoxDecoration(
                      border: Border(top: BorderSide(color: Color(0x14000000))),
                    ),
                    child: Row(
                      children: [
                        Expanded(
                          child: FilledButton.icon(
                            style: FilledButton.styleFrom(
                              backgroundColor: kAccent,
                              padding: const EdgeInsets.symmetric(vertical: 11),
                              shape: const StadiumBorder(),
                            ),
                            onPressed: () {
                              Navigator.pop(ctx);
                              _salinTeks('WhatsApp Pengelola', wa.isNotEmpty ? wa : telp);
                            },
                            icon: const Icon(Icons.chat_bubble_outline, size: 16),
                            label: const Text('Hubungi WhatsApp', style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.bold)),
                          ),
                        ),
                        const SizedBox(width: 8),
                        OutlinedButton(
                          style: OutlinedButton.styleFrom(
                            foregroundColor: kBrand,
                            side: const BorderSide(color: kBrand),
                            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 11),
                            shape: const StadiumBorder(),
                          ),
                          onPressed: () {
                            Navigator.pop(ctx);
                            _salinTeks('Telepon Pengelola', telp);
                          },
                          child: const Text('Telepon', style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.bold)),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  Future<void> _kirimAuth() async {
    final email = _emailCtrl.text.trim();
    final password = _passCtrl.text;
    final nama = _namaCtrl.text.trim();
    if (email.isEmpty || password.isEmpty || (_isRegisterMode && nama.isEmpty)) {
      setState(() => _authGalat = 'Mohon lengkapi seluruh kolom wajib.');
      return;
    }
    setState(() {
      _authMemuat = true;
      _authGalat = null;
    });
    try {
      if (_isRegisterMode) {
        await KostkuApi.register(
          nama: nama,
          email: email,
          password: password,
          noHp: _noHpCtrl.text.trim(),
          role: _roleRegister,
        );
      }
      final (user, _) = await KostkuApi.login(email, password);
      if (!mounted) return;
      setState(() {
        _user = user;
        _authMemuat = false;
        _passCtrl.clear();
      });
      _toast(
        _isRegisterMode
            ? 'Registrasi berhasil. Selamat datang, ${user.nama}!'
            : 'Selamat datang kembali, ${user.nama}!',
      );
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _authGalat = e.toString().replaceFirst('Exception: ', '');
        _authMemuat = false;
      });
    }
  }

  void _keluar() {
    setState(() {
      _user = null;
      KostkuApi.token = null;
    });
    _toast('Anda telah keluar.');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: _buildAppBar(),
      body: _memuat
          ? const Center(child: CircularProgressIndicator(color: kBrand))
          : _galat != null
              ? _buildErrorView()
              : _buildCurrentTab(),
      bottomNavigationBar: _buildBottomNav(),
    );
  }

  PreferredSizeWidget _buildAppBar() {
    return AppBar(
      backgroundColor: Colors.white,
      surfaceTintColor: Colors.white,
      elevation: 0.5,
      toolbarHeight: 54,
      titleSpacing: 14,
      title: Row(
        children: [
          Container(
            width: 30,
            height: 30,
            decoration: BoxDecoration(
              color: kBrand,
              borderRadius: BorderRadius.circular(9),
            ),
            child: const Icon(Icons.home_rounded, color: Colors.white, size: 18),
          ),
          const SizedBox(width: 8),
          const Text(
            'KostKu',
            style: TextStyle(
              color: kBrand,
              fontWeight: FontWeight.w900,
              fontSize: 18,
              letterSpacing: -0.3,
            ),
          ),
        ],
      ),
      actions: [
        if (_user != null)
          Padding(
            padding: const EdgeInsets.only(right: 12),
            child: ActionChip(
              backgroundColor: kCream,
              side: BorderSide.none,
              visualDensity: VisualDensity.compact,
              avatar: const CircleAvatar(
                backgroundColor: kBrand,
                child: Icon(Icons.person, size: 12, color: Colors.white),
              ),
              label: Text(
                _user!.nama.split(' ').first,
                style: const TextStyle(fontSize: 11.5, fontWeight: FontWeight.bold, color: kBrand),
              ),
              onPressed: () => setState(() => _navIndex = 4),
            ),
          )
        else
          Padding(
            padding: const EdgeInsets.only(right: 12),
            child: FilledButton(
              style: FilledButton.styleFrom(
                backgroundColor: kAccent,
                visualDensity: VisualDensity.compact,
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                shape: const StadiumBorder(),
              ),
              onPressed: () {
                setState(() {
                  _isRegisterMode = false;
                  _navIndex = 4;
                });
              },
              child: const Text('Masuk', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
            ),
          ),
      ],
    );
  }

  Widget _buildBottomNav() {
    return NavigationBar(
      height: 62,
      selectedIndex: _navIndex,
      backgroundColor: Colors.white,
      surfaceTintColor: Colors.white,
      indicatorColor: kBrand.withValues(alpha: 0.14),
      labelBehavior: NavigationDestinationLabelBehavior.alwaysShow,
      onDestinationSelected: (idx) => setState(() => _navIndex = idx),
      destinations: [
        const NavigationDestination(
          icon: Icon(Icons.home_outlined, size: 21),
          selectedIcon: Icon(Icons.home_rounded, color: kBrand, size: 21),
          label: 'Beranda',
        ),
        const NavigationDestination(
          icon: Icon(Icons.search_rounded, size: 21),
          selectedIcon: Icon(Icons.search_rounded, color: kBrand, size: 21),
          label: 'Cari',
        ),
        const NavigationDestination(
          icon: Icon(Icons.fact_check_outlined, size: 21),
          selectedIcon: Icon(Icons.fact_check_rounded, color: kBrand, size: 21),
          label: 'Cara Kerja',
        ),
        const NavigationDestination(
          icon: Icon(Icons.help_outline_rounded, size: 21),
          selectedIcon: Icon(Icons.help_rounded, color: kBrand, size: 21),
          label: 'Bantuan',
        ),
        NavigationDestination(
          icon: const Icon(Icons.person_outline_rounded, size: 21),
          selectedIcon: const Icon(Icons.person_rounded, color: kBrand, size: 21),
          label: _user != null ? 'Profil' : 'Akun',
        ),
      ],
    );
  }

  Widget _buildErrorView() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.cloud_off_rounded, size: 48, color: kBrand),
            const SizedBox(height: 10),
            const Text(
              'Gagal memuat data kos',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: kBrand),
            ),
            const SizedBox(height: 6),
            Text(
              '$_galat',
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 12, color: Colors.black54),
            ),
            const SizedBox(height: 14),
            FilledButton(
              style: FilledButton.styleFrom(backgroundColor: kAccent, shape: const StadiumBorder()),
              onPressed: _muatData,
              child: const Text('Coba Lagi'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCurrentTab() {
    switch (_navIndex) {
      case 0:
        return _buildBerandaTab();
      case 1:
        return _buildCariKosTab();
      case 2:
        return _buildCaraKerjaTab();
      case 3:
        return _buildBantuanTab();
      case 4:
        return _buildAkunTab();
      default:
        return _buildBerandaTab();
    }
  }

  // ==================== TAB 0: BERANDA MOBILE ====================
  Widget _buildBerandaTab() {
    final kos = _kos!;
    return RefreshIndicator(
      color: kBrand,
      onRefresh: _muatData,
      child: ListView(
        controller: _berandaScroll,
        padding: EdgeInsets.zero,
        children: [
          // Hero sesuai mockup HP
          Container(
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                colors: [kBrandDark, kBrand, kBrandLight],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
            ),
            padding: const EdgeInsets.fromLTRB(14, 16, 14, 18),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  kos.alamat,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    color: Colors.white.withValues(alpha: 0.85),
                    fontSize: 11.5,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(height: 4),
                const Text(
                  'Temukan Kos Nyaman',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 21,
                    fontWeight: FontWeight.w900,
                  ),
                ),
                const SizedBox(height: 12),
                _buildSearchFormCompact(
                  onSubmit: () {
                    final ctx = _kamarSectionKey.currentContext;
                    if (ctx != null) {
                      Scrollable.ensureVisible(
                        ctx,
                        duration: const Duration(milliseconds: 300),
                      );
                    }
                  },
                ),
              ],
            ),
          ),

          // Chip filter cepat
          Padding(
            padding: const EdgeInsets.fromLTRB(14, 12, 14, 2),
            child: _buildFilterChips(),
          ),

          // Header Kamar Tersedia
          Padding(
            key: _kamarSectionKey,
            padding: const EdgeInsets.fromLTRB(14, 10, 14, 6),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  _terfilter ? 'Hasil Pencarian' : 'Kamar Tersedia',
                  style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w900),
                ),
                Text(
                  '${_hasilKamar.length} kamar',
                  style: const TextStyle(fontSize: 11.5, color: Colors.black54),
                ),
              ],
            ),
          ),

          if (_hasilKamar.isEmpty)
            _buildEmptyKamarCard()
          else
            ..._hasilKamar.map(
              (k) => Padding(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 5),
                child: _buildKamarCardMobile(k),
              ),
            ),

          // Cara kerja ringkas
          Padding(
            padding: const EdgeInsets.fromLTRB(14, 14, 14, 4),
            child: _buildCaraKerjaSection(),
          ),

          // Banner Daftarkan Kos Anda
          Padding(
            padding: const EdgeInsets.fromLTRB(14, 8, 14, 20),
            child: _buildCtaFooterCard(kos),
          ),
        ],
      ),
    );
  }

  // ==================== TAB 1: CARI KOS (LIST RINGKAS MOBILE) ====================
  Widget _buildCariKosTab() {
    return Column(
      children: [
        Container(
          color: Colors.white,
          padding: const EdgeInsets.fromLTRB(14, 10, 14, 10),
          child: Column(
            children: [
              _buildSearchFormCompact(onSubmit: () {}),
              const SizedBox(height: 8),
              _buildFilterChips(),
            ],
          ),
        ),
        Expanded(
          child: _hasilKamar.isEmpty
              ? ListView(children: [_buildEmptyKamarCard()])
              : ListView.separated(
                  padding: const EdgeInsets.all(14),
                  itemCount: _hasilKamar.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 10),
                  itemBuilder: (_, i) => _buildKamarTileCompact(_hasilKamar[i]),
                ),
        ),
      ],
    );
  }

  // ==================== TAB 2: CARA KERJA ====================
  Widget _buildCaraKerjaTab() {
    final kos = _kos!;
    return ListView(
      padding: const EdgeInsets.all(14),
      children: [
        _buildCaraKerjaSection(),
        if (kos.aturan.isNotEmpty) ...[
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(18),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Aturan & Tata Tertib Kos', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800)),
                const SizedBox(height: 8),
                ...kos.aturan.map(
                  (a) => Padding(
                    padding: const EdgeInsets.only(bottom: 5),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('• ', style: TextStyle(color: kBrand, fontWeight: FontWeight.bold)),
                        Expanded(child: Text(a, style: const TextStyle(fontSize: 12.5, color: Colors.black87))),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
        const SizedBox(height: 12),
        _buildCtaFooterCard(kos),
      ],
    );
  }

  // ==================== TAB 3: BANTUAN ====================
  Widget _buildBantuanTab() {
    final kos = _kos!;
    return ListView(
      padding: const EdgeInsets.all(14),
      children: [
        Container(
          padding: const EdgeInsets.all(18),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(20),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: kBrand.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(999),
                ),
                child: const Text(
                  'Bantuan & Kontak Pengelola',
                  style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: kBrand),
                ),
              ),
              const SizedBox(height: 10),
              Text(kos.nama, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w900)),
              const SizedBox(height: 3),
              Text(kos.alamat, style: const TextStyle(fontSize: 12.5, color: Colors.black54)),
              const Divider(height: 24),
              _infoRow('Pengelola', kos.namaPengelola),
              const SizedBox(height: 8),
              _infoRow('Telepon / WA', kos.telepon),
              const SizedBox(height: 8),
              _infoRow('Jam Kunjung', kos.jamKunjung),
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(
                    child: FilledButton.icon(
                      style: FilledButton.styleFrom(
                        backgroundColor: kAccent,
                        padding: const EdgeInsets.symmetric(vertical: 11),
                        shape: const StadiumBorder(),
                      ),
                      onPressed: () => _salinTeks('WhatsApp', kos.whatsapp.isNotEmpty ? kos.whatsapp : kos.telepon),
                      icon: const Icon(Icons.chat_bubble_outline, size: 16),
                      label: const Text('WhatsApp', style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.bold)),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: OutlinedButton.icon(
                      style: OutlinedButton.styleFrom(
                        foregroundColor: kBrand,
                        side: const BorderSide(color: kBrand),
                        padding: const EdgeInsets.symmetric(vertical: 11),
                        shape: const StadiumBorder(),
                      ),
                      onPressed: () => _salinTeks('Nomor Telepon', kos.telepon),
                      icon: const Icon(Icons.call_outlined, size: 16),
                      label: const Text('Telepon', style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.bold)),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ],
    );
  }

  // ==================== TAB 4: AKUN ====================
  Widget _buildAkunTab() {
    if (_user != null) {
      final u = _user!;
      return ListView(
        padding: const EdgeInsets.all(14),
        children: [
          Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(20),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    CircleAvatar(
                      radius: 22,
                      backgroundColor: kBrand,
                      child: Text(
                        u.nama.isNotEmpty ? u.nama[0].toUpperCase() : 'U',
                        style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(u.nama, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w800)),
                          Text(u.email, style: const TextStyle(fontSize: 12, color: Colors.black54)),
                        ],
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(color: kCream, borderRadius: BorderRadius.circular(999)),
                      child: Text(
                        u.role,
                        style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: kBrand),
                      ),
                    ),
                  ],
                ),
                const Divider(height: 24),
                _infoRow('No. HP', u.noHp.isNotEmpty ? u.noHp : '-'),
                const SizedBox(height: 16),
                SizedBox(
                  width: double.infinity,
                  child: OutlinedButton.icon(
                    style: OutlinedButton.styleFrom(
                      foregroundColor: Colors.red.shade700,
                      side: BorderSide(color: Colors.red.shade200),
                      padding: const EdgeInsets.symmetric(vertical: 11),
                      shape: const StadiumBorder(),
                    ),
                    onPressed: _keluar,
                    icon: const Icon(Icons.logout_rounded, size: 16),
                    label: const Text('Keluar', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
                  ),
                ),
              ],
            ),
          ),
        ],
      );
    }

    return ListView(
      padding: const EdgeInsets.all(14),
      children: [
        Container(
          padding: const EdgeInsets.all(18),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(20),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                _isRegisterMode ? 'Buat Akun Baru' : 'Masuk ke Akun',
                style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: kBrand),
              ),
              const SizedBox(height: 4),
              Text(
                _isRegisterMode
                    ? 'Daftar sebagai penghuni atau pemilik kos.'
                    : 'Masuk untuk mengakses fitur KostKu.',
                style: const TextStyle(fontSize: 12.5, color: Colors.black54),
              ),
              const SizedBox(height: 14),
              if (_isRegisterMode) ...[
                _textField(_namaCtrl, 'Nama lengkap'),
                const SizedBox(height: 10),
                _textField(_noHpCtrl, 'No. HP (opsional)', keyboardType: TextInputType.phone),
                const SizedBox(height: 10),
                DropdownButtonFormField<String>(
                  initialValue: _roleRegister,
                  decoration: _inputDecoration('Peran Akun'),
                  items: const [
                    DropdownMenuItem(value: 'penghuni', child: Text('Penghuni / Pencari Kos')),
                    DropdownMenuItem(value: 'pengelola', child: Text('Pemilik / Pengelola Kos')),
                  ],
                  onChanged: (v) {
                    if (v != null) setState(() => _roleRegister = v);
                  },
                ),
                const SizedBox(height: 10),
              ],
              _textField(_emailCtrl, 'Email', keyboardType: TextInputType.emailAddress),
              const SizedBox(height: 10),
              _textField(_passCtrl, 'Password', obscure: true),
              if (_authGalat != null) ...[
                const SizedBox(height: 10),
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: Colors.red.shade50,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Text(_authGalat!, style: TextStyle(fontSize: 12, color: Colors.red.shade800)),
                ),
              ],
              const SizedBox(height: 14),
              SizedBox(
                width: double.infinity,
                child: FilledButton(
                  style: FilledButton.styleFrom(
                    backgroundColor: kAccent,
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    shape: const StadiumBorder(),
                  ),
                  onPressed: _authMemuat ? null : _kirimAuth,
                  child: Text(
                    _authMemuat
                        ? 'Memproses…'
                        : _isRegisterMode
                            ? 'Daftar'
                            : 'Masuk',
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13.5),
                  ),
                ),
              ),
              const SizedBox(height: 8),
              Center(
                child: TextButton(
                  onPressed: () {
                    setState(() {
                      _isRegisterMode = !_isRegisterMode;
                      _authGalat = null;
                    });
                  },
                  child: Text(
                    _isRegisterMode ? 'Sudah punya akun? Masuk' : 'Belum punya akun? Daftar',
                    style: const TextStyle(color: kBrand, fontWeight: FontWeight.bold, fontSize: 12.5),
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  // ==================== KOMPONEN MOBILE RINGKAS ====================
  Widget _buildSearchFormCompact({required VoidCallback onSubmit}) {
    final hargaItems = <DropdownMenuItem<int>>[
      const DropdownMenuItem(value: 0, child: Text('Harga')),
      ..._daftarHarga.map(
        (h) => DropdownMenuItem(
          value: h,
          child: Text('≤ ${KostkuApi.rupiah(h)}'),
        ),
      ),
    ];

    final tipeItems = <DropdownMenuItem<String>>[
      const DropdownMenuItem(value: '', child: Text('Semua Tipe')),
      ..._daftarTipe.map((t) => DropdownMenuItem(value: t, child: Text(t))),
    ];

    return Column(
      children: [
        Row(
          children: [
            Expanded(
              flex: 6,
              child: SizedBox(
                height: 40,
                child: TextField(
                  controller: _kataCtrl,
                  onChanged: (v) => setState(() => _kata = v),
                  decoration: InputDecoration(
                    hintText: 'Lokasi / fasilitas…',
                    hintStyle: const TextStyle(fontSize: 12, color: Colors.black45),
                    prefixIcon: const Icon(Icons.search, size: 17, color: kBrand),
                    prefixIconConstraints: const BoxConstraints(minWidth: 34),
                    filled: true,
                    fillColor: Colors.white,
                    contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 0),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(10),
                      borderSide: const BorderSide(color: Color(0xFFE5E7EB)),
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(10),
                      borderSide: const BorderSide(color: Color(0xFFE5E7EB)),
                    ),
                  ),
                  style: const TextStyle(fontSize: 12.5),
                ),
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              flex: 5,
              child: SizedBox(
                height: 40,
                child: DropdownButtonFormField<int>(
                  initialValue: _daftarHarga.contains(_hargaMaks) ? _hargaMaks : 0,
                  isExpanded: true,
                  decoration: _pillFieldDecoration(),
                  style: const TextStyle(fontSize: 12, color: Colors.black87),
                  items: hargaItems,
                  onChanged: (v) => setState(() => _hargaMaks = v ?? 0),
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        SizedBox(
          height: 40,
          child: DropdownButtonFormField<String>(
            initialValue: _daftarTipe.contains(_tipe) ? _tipe : '',
            isExpanded: true,
            decoration: _pillFieldDecoration(),
            style: const TextStyle(fontSize: 12, color: Colors.black87),
            items: tipeItems,
            onChanged: (v) => setState(() => _tipe = v ?? ''),
          ),
        ),
        const SizedBox(height: 8),
        SizedBox(
          width: double.infinity,
          height: 40,
          child: FilledButton(
            style: FilledButton.styleFrom(
              backgroundColor: kAccent,
              shape: const StadiumBorder(),
            ),
            onPressed: onSubmit,
            child: const Text(
              'Cari Kos',
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
            ),
          ),
        ),
      ],
    );
  }

  InputDecoration _pillFieldDecoration() {
    return InputDecoration(
      filled: true,
      fillColor: Colors.white,
      isDense: true,
      contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 9),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: const BorderSide(color: Color(0xFFE5E7EB)),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: const BorderSide(color: Color(0xFFE5E7EB)),
      ),
    );
  }

  Widget _buildFilterChips() {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(
        children: [
          ..._daftarTipe.map((t) {
            final aktif = _tipe == t;
            return Padding(
              padding: const EdgeInsets.only(right: 6),
              child: ChoiceChip(
                label: Text(t),
                selected: aktif,
                selectedColor: kBrand,
                backgroundColor: Colors.white,
                visualDensity: VisualDensity.compact,
                labelStyle: TextStyle(
                  color: aktif ? Colors.white : kBrand,
                  fontWeight: FontWeight.bold,
                  fontSize: 11.5,
                ),
                side: BorderSide(color: aktif ? kBrand : kBrand.withValues(alpha: 0.4)),
                shape: const StadiumBorder(),
                showCheckmark: false,
                onSelected: (_) => setState(() => _tipe = aktif ? '' : t),
              ),
            );
          }),
          ChoiceChip(
            label: const Text('Harga Termurah'),
            selected: _termurah,
            selectedColor: kBrand,
            backgroundColor: Colors.white,
            visualDensity: VisualDensity.compact,
            labelStyle: TextStyle(
              color: _termurah ? Colors.white : kBrand,
              fontWeight: FontWeight.bold,
              fontSize: 11.5,
            ),
            side: BorderSide(color: _termurah ? kBrand : kBrand.withValues(alpha: 0.4)),
            shape: const StadiumBorder(),
            showCheckmark: false,
            onSelected: (_) => setState(() => _termurah = !_termurah),
          ),
          if (_terfilter)
            Padding(
              padding: const EdgeInsets.only(left: 4),
              child: TextButton(
                onPressed: _resetFilter,
                child: const Text('Reset', style: TextStyle(fontSize: 11.5, color: Colors.black54)),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildEmptyKamarCard() {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
      ),
      child: Column(
        children: [
          const Text('Tidak ada kamar yang cocok.', style: TextStyle(fontSize: 13, color: Colors.black54)),
          TextButton(
            onPressed: _resetFilter,
            child: const Text('Reset filter', style: TextStyle(fontSize: 12.5, color: kBrand, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  // Kartu kamar proporsional untuk Beranda mobile (tinggi gambar 145px)
  Widget _buildKamarCardMobile(KamarModel k) {
    final shownFasilitas = k.fasilitas.take(3).toList();
    final sisa = k.fasilitas.length - shownFasilitas.length;

    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(18),
      elevation: 0.6,
      shadowColor: Colors.black12,
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: () => _bukaDetailKamar(k),
        child: Padding(
          padding: const EdgeInsets.all(10),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Stack(
                children: [
                  ClipRRect(
                    borderRadius: BorderRadius.circular(12),
                    child: SizedBox(
                      height: 145,
                      width: double.infinity,
                      child: k.foto.isNotEmpty
                          ? Image.network(
                              KostkuApi.aset(k.foto.first),
                              fit: BoxFit.cover,
                              errorBuilder: (_, __, ___) => _placeholderFoto(),
                            )
                          : _placeholderFoto(),
                    ),
                  ),
                  Positioned(
                    top: 8,
                    left: 8,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 3),
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.94),
                        borderRadius: BorderRadius.circular(999),
                      ),
                      child: Text(
                        k.tipe,
                        style: const TextStyle(fontSize: 10.5, fontWeight: FontWeight.bold, color: kBrand),
                      ),
                    ),
                  ),
                  Positioned(
                    top: 8,
                    right: 8,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 3),
                      decoration: BoxDecoration(
                        color: const Color(0xFF10B981),
                        borderRadius: BorderRadius.circular(999),
                      ),
                      child: Text(
                        k.status,
                        style: const TextStyle(fontSize: 10.5, fontWeight: FontWeight.bold, color: Colors.white),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Kamar ${k.kode}',
                    style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w800),
                  ),
                  Text(
                    '${KostkuApi.rupiah(k.harga)}/bln',
                    style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w900, color: kBrand),
                  ),
                ],
              ),
              const SizedBox(height: 2),
              Text(
                'Lantai ${k.lantai} · ${k.luas} · ${_kos?.nama ?? "KostKu"}',
                style: const TextStyle(fontSize: 11.5, color: Colors.black54),
              ),
              const SizedBox(height: 8),
              Wrap(
                spacing: 5,
                runSpacing: 5,
                children: [
                  ...shownFasilitas.map(
                    (f) => Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: kCream,
                        borderRadius: BorderRadius.circular(999),
                      ),
                      child: Text(f, style: const TextStyle(fontSize: 10.5, fontWeight: FontWeight.w500)),
                    ),
                  ),
                  if (sisa > 0)
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: kCream,
                        borderRadius: BorderRadius.circular(999),
                      ),
                      child: Text('+$sisa', style: const TextStyle(fontSize: 10.5, color: Colors.black54)),
                    ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  // List tile horizontal ringkas untuk tab Cari
  Widget _buildKamarTileCompact(KamarModel k) {
    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(16),
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: () => _bukaDetailKamar(k),
        child: Padding(
          padding: const EdgeInsets.all(10),
          child: Row(
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(12),
                child: SizedBox(
                  width: 84,
                  height: 84,
                  child: k.foto.isNotEmpty
                      ? Image.network(
                          KostkuApi.aset(k.foto.first),
                          fit: BoxFit.cover,
                          errorBuilder: (_, __, ___) => _placeholderFoto(),
                        )
                      : _placeholderFoto(),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text('Kamar ${k.kode}', style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 14.5)),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                          decoration: BoxDecoration(color: kCream, borderRadius: BorderRadius.circular(999)),
                          child: Text(k.tipe, style: const TextStyle(fontSize: 10.5, fontWeight: FontWeight.bold, color: kBrand)),
                        ),
                      ],
                    ),
                    const SizedBox(height: 2),
                    Text('Lantai ${k.lantai} · ${k.luas}', style: const TextStyle(fontSize: 11.5, color: Colors.black54)),
                    const SizedBox(height: 4),
                    Text(
                      k.fasilitas.join(' · '),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(fontSize: 11, color: Colors.black45),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      '${KostkuApi.rupiah(k.harga)}/bln',
                      style: const TextStyle(fontSize: 13.5, fontWeight: FontWeight.w900, color: kBrand),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _placeholderFoto() {
    return Container(
      color: kCream,
      alignment: Alignment.center,
      child: const Icon(Icons.bed_outlined, size: 32, color: kBrand),
    );
  }

  Widget _buildCaraKerjaSection() {
    const langkah = [
      ('1', 'Cari Kos', 'Pilih kamar sesuai fasilitas & anggaran.'),
      ('2', 'Survei & Kontak', 'Hubungi pengelola via WhatsApp/telepon.'),
      ('3', 'Bayar & Huni', 'Daftar akun, bayar tagihan, mulai huni.'),
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('Cara Kerja', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900)),
        const SizedBox(height: 8),
        ...langkah.map(
          (l) => Container(
            margin: const EdgeInsets.only(bottom: 8),
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(14),
            ),
            child: Row(
              children: [
                CircleAvatar(
                  radius: 14,
                  backgroundColor: kBrand,
                  child: Text(
                    l.$1,
                    style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(l.$2, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 13)),
                      Text(l.$3, style: const TextStyle(fontSize: 11.5, color: Colors.black54)),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildCtaFooterCard(KosInfo kos) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: kBrandDark,
        borderRadius: BorderRadius.circular(18),
      ),
      child: Column(
        children: [
          Row(
            children: [
              const Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Daftarkan Kos Anda',
                      style: TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.w900),
                    ),
                    SizedBox(height: 2),
                    Text(
                      'Kelola kamar & tagihan dalam satu aplikasi.',
                      style: TextStyle(color: Colors.white70, fontSize: 11.5),
                    ),
                  ],
                ),
              ),
              FilledButton(
                style: FilledButton.styleFrom(
                  backgroundColor: kAccent,
                  shape: const StadiumBorder(),
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                  visualDensity: VisualDensity.compact,
                ),
                onPressed: () {
                  setState(() {
                    _isRegisterMode = true;
                    _roleRegister = 'pengelola';
                    _navIndex = 4;
                  });
                },
                child: const Text('Mulai Sekarang', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 11.5)),
              ),
            ],
          ),
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 10),
            child: Divider(color: Colors.white24, height: 1),
          ),
          Text(
            '${kos.nama} · ${kos.alamat}',
            textAlign: TextAlign.center,
            style: const TextStyle(color: Colors.white70, fontSize: 11),
          ),
        ],
      ),
    );
  }

  Widget _infoRow(String label, String value) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: const TextStyle(fontSize: 12, color: Colors.black54)),
        Flexible(
          child: Text(
            value,
            textAlign: TextAlign.right,
            style: const TextStyle(fontSize: 12.5, fontWeight: FontWeight.w700),
          ),
        ),
      ],
    );
  }

  Widget _textField(
    TextEditingController ctrl,
    String hint, {
    bool obscure = false,
    TextInputType? keyboardType,
  }) {
    return TextField(
      controller: ctrl,
      obscureText: obscure,
      keyboardType: keyboardType,
      decoration: _inputDecoration(hint),
      style: const TextStyle(fontSize: 13),
    );
  }

  InputDecoration _inputDecoration(String hint) {
    return InputDecoration(
      labelText: hint,
      isDense: true,
      contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 11),
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(color: Colors.grey.shade300),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: kBrand, width: 1.5),
      ),
    );
  }
}
