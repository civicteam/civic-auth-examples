class AuthUser {
  final String sub;
  final String? email;
  final String name;
  final String? picture;

  AuthUser({required this.sub, this.email, required this.name, this.picture});

  factory AuthUser.fromJson(Map<String, dynamic> json) {
    return AuthUser(
      sub: json['sub'] ?? '',
      email: json['email'],
      name: json['name'] ?? json['given_name'] ?? '',
      picture: json['picture'],
    );
  }
}
