class AppUser {
  final String id;
  final String name;
  final String email;
  final String? phone;
  final String role;
  final bool emailVerified;
  final String? avatarUrl;

  AppUser({
    required this.id,
    required this.name,
    required this.email,
    this.phone,
    required this.role,
    required this.emailVerified,
    this.avatarUrl,
  });

  factory AppUser.fromJson(Map<String, dynamic> json) => AppUser(
        id: json['id'] as String,
        name: json['name'] as String,
        email: json['email'] as String,
        phone: json['phone'] as String?,
        role: json['role'] as String? ?? 'MEMBER',
        emailVerified: json['emailVerified'] as bool? ?? false,
        avatarUrl: json['avatarUrl'] as String?,
      );
}
