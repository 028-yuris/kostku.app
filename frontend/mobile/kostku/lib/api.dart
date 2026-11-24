import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;

class KosInfo {
  final String nama;
  final String alamat;
  final String kontakWhatsApp;
  final String whatsapp;
  final String telepon;
  final String namaPengelola;
  final String jamKunjung;
  final List<String> aturan;
  final String deskripsi;

  const KosInfo({
    required this.nama,
    required this.alamat,
    required this.kontakWhatsApp,
    required this.whatsapp,
    required this.telepon,
    required this.namaPengelola,
    required this.jamKunjung,
    required this.aturan,
    required this.deskripsi,
  });

  factory KosInfo.fromJson(Map<String, dynamic> j) {
    return KosInfo(
      nama: (j['nama'] ?? 'KostKu').toString(),
      alamat: (j['alamat'] ?? '').toString(),
      kontakWhatsApp: (j['kontakWhatsApp'] ?? '').toString(),
      whatsapp: (j['whatsapp'] ?? '').toString(),
      telepon: (j['telepon'] ?? '').toString(),
      namaPengelola: (j['namaPengelola'] ?? '').toString(),
      jamKunjung: (j['jamKunjung'] ?? '').toString(),
      aturan: (j['aturan'] as List?)?.map((e) => e.toString()).toList() ?? const [],
      deskripsi: (j['deskripsi'] ?? '').toString(),
    );
  }
}

class KamarModel {
  final int id;
  final String kode;
  final int lantai;
  final String luas;
  final String tipe;
  final int harga;
  final List<String> fasilitas;
  final String status;
  final String deskripsi;
  final List<String> foto;
  final List<String> aturanKost;
  final Map<String, dynamic>? kontakPengelola;

  const KamarModel({
    required this.id,
    required this.kode,
    required this.lantai,
    required this.luas,
    required this.tipe,
    required this.harga,
    required this.fasilitas,
    required this.status,
    required this.deskripsi,
    required this.foto,
    this.aturanKost = const [],
    this.kontakPengelola,
  });

  factory KamarModel.fromJson(Map<String, dynamic> j) {
    return KamarModel(
      id: (j['id'] as num?)?.toInt() ?? 0,
      kode: (j['kode'] ?? j['nomor'] ?? '').toString(),
      lantai: (j['lantai'] as num?)?.toInt() ?? 1,
      luas: (j['luas'] ?? '').toString(),
      tipe: (j['tipe'] ?? 'Standard').toString(),
      harga: (j['harga'] as num?)?.toInt() ?? 0,
      fasilitas: (j['fasilitas'] as List?)?.map((e) => e.toString()).toList() ?? const [],
      status: (j['status'] ?? 'tersedia').toString(),
      deskripsi: (j['deskripsi'] ?? '').toString(),
      foto: (j['foto'] as List?)?.map((e) => e.toString()).toList() ?? const [],
      aturanKost: (j['aturanKost'] as List?)?.map((e) => e.toString()).toList() ?? const [],
      kontakPengelola: j['kontakPengelola'] is Map<String, dynamic>
          ? j['kontakPengelola'] as Map<String, dynamic>
          : null,
    );
  }
}

class UserModel {
  final int id;
  final String role;
  final String nama;
  final String email;
  final String noHp;

  const UserModel({
    required this.id,
    required this.role,
    required this.nama,
    required this.email,
    required this.noHp,
  });

  factory UserModel.fromJson(Map<String, dynamic> j) {
    return UserModel(
      id: (j['id'] as num?)?.toInt() ?? 0,
      role: (j['role'] ?? 'penghuni').toString(),
      nama: (j['nama'] ?? '').toString(),
      email: (j['email'] ?? '').toString(),
      noHp: (j['noHp'] ?? j['no_hp'] ?? '').toString(),
    );
  }
}

class KostkuApi {
  static String baseUrl = _resolveInitialBaseUrl();
  static String? token;

  static String _resolveInitialBaseUrl() {
    const envUrl = String.fromEnvironment('API_URL');
    if (envUrl.isNotEmpty) {
      return envUrl
          .replaceAll(RegExp(r'/+$'), '')
          .replaceAll(RegExp(r'/api/v1$'), '');
    }
    if (!kIsWeb && defaultTargetPlatform == TargetPlatform.android) {
      return 'http://10.0.2.2:3000';
    }
    return 'http://localhost:3000';
  }

  static String aset(String? path) {
    if (path == null || path.isEmpty) return '';
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    final clean = path.startsWith('/') ? path.substring(1) : path;
    return '$baseUrl/$clean';
  }

  static String rupiah(num nominal) {
    final s = nominal.round().toString();
    final buf = StringBuffer();
    for (int i = 0; i < s.length; i++) {
      final posFromEnd = s.length - i;
      buf.write(s[i]);
      if (posFromEnd > 1 && posFromEnd % 3 == 1) buf.write('.');
    }
    return 'Rp $buf';
  }

  static Future<dynamic> _request(
    String method,
    String path, {
    Map<String, dynamic>? body,
  }) async {
    final uri = Uri.parse('$baseUrl/api/v1$path');
    final headers = <String, String>{
      'Content-Type': 'application/json; charset=utf-8',
      if (token != null && token!.isNotEmpty) 'Authorization': 'Bearer $token',
    };

    late http.Response res;
    if (method == 'POST') {
      res = await http
          .post(uri, headers: headers, body: body != null ? jsonEncode(body) : null)
          .timeout(const Duration(seconds: 8));
    } else {
      res = await http.get(uri, headers: headers).timeout(const Duration(seconds: 8));
    }

    final decoded = res.body.isNotEmpty ? jsonDecode(res.body) : <String, dynamic>{};

    if (res.statusCode < 200 ||
        res.statusCode >= 300 ||
        (decoded is Map && (decoded['status'] == false || decoded['success'] == false))) {
      final msg = (decoded is Map && decoded['message'] != null)
          ? decoded['message'].toString()
          : 'Permintaan gagal (${res.statusCode})';
      throw Exception(msg);
    }
    return decoded is Map ? decoded['data'] : decoded;
  }

  static Future<KosInfo> getKos() async {
    final data = await _request('GET', '/kos') as Map<String, dynamic>;
    return KosInfo.fromJson(data);
  }

  static Future<List<KamarModel>> getKamarTersedia() async {
    final data = await _request('GET', '/kamar?status=kosong') as List;
    return data.map((e) => KamarModel.fromJson(e as Map<String, dynamic>)).toList();
  }

  static Future<KamarModel> getKamarDetail(int id) async {
    final data = await _request('GET', '/kamar/$id') as Map<String, dynamic>;
    return KamarModel.fromJson(data);
  }

  static Future<(UserModel, String)> login(String email, String password) async {
    final data = await _request(
      'POST',
      '/auth/login',
      body: {'email': email, 'password': password},
    ) as Map<String, dynamic>;
    final user = UserModel.fromJson(data['user'] as Map<String, dynamic>);
    final jwt = (data['token'] ?? '').toString();
    token = jwt;
    return (user, jwt);
  }

  static Future<UserModel> register({
    required String nama,
    required String email,
    required String password,
    String? noHp,
    String role = 'penghuni',
  }) async {
    final data = await _request(
      'POST',
      '/auth/register',
      body: {
        'nama': nama,
        'email': email,
        'password': password,
        'noHp': noHp ?? '',
        'role': role,
      },
    ) as Map<String, dynamic>;
    return UserModel.fromJson(data);
  }
}
