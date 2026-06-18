import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../providers/locale_provider.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _identifierController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _loading = false;
  String? _error;

  Future<void> _login() async {
    setState(() { _loading = true; _error = null; });
    try {
      await context.read<AuthProvider>().login(
        _identifierController.text,
        _passwordController.text,
      );
    } catch (e) {
      setState(() { _error = e.toString(); });
    } finally {
      setState(() { _loading = false; });
    }
  }

  @override
  Widget build(BuildContext context) {
    final locale = context.watch<LocaleProvider>();

    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                width: 80,
                height: 80,
                decoration: BoxDecoration(
                  color: Theme.of(context).colorScheme.primaryContainer,
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  Icons.groups,
                  size: 40,
                  color: Theme.of(context).colorScheme.primary,
                ),
              ),
              const SizedBox(height: 24),
              Text(
                locale.locale.languageCode == 'om'
                    ? 'Sirna Bulchiinsa Afosha'
                    : 'Afosha Management System',
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 8),
              Text(
                locale.locale.languageCode == 'om'
                    ? 'Akkaawuntii keessan fayyadamaa'
                    : 'Sign in with your account',
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: Colors.grey,
                ),
              ),
              const SizedBox(height: 32),
              TextField(
                controller: _identifierController,
                decoration: InputDecoration(
                  labelText: locale.locale.languageCode == 'om'
                      ? 'Lakkoofsa Bilbilaa'
                      : 'Phone Number',
                  border: const OutlineInputBorder(),
                  prefixIcon: const Icon(Icons.phone),
                ),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: _passwordController,
                obscureText: true,
                decoration: InputDecoration(
                  labelText: locale.locale.languageCode == 'om'
                      ? 'Jecha Iccitii'
                      : 'Password',
                  border: const OutlineInputBorder(),
                  prefixIcon: const Icon(Icons.lock),
                ),
              ),
              Align(
                alignment: Alignment.centerRight,
                child: TextButton(
                  onPressed: () {
                    Navigator.of(context).pushNamed('/forgot-password');
                  },
                  child: Text(
                    locale.locale.languageCode == 'om'
                        ? 'Jecha iccitii dagatte?'
                        : 'Forgot password?',
                    style: TextStyle(
                      color: Theme.of(context).colorScheme.primary,
                      fontSize: 13,
                    ),
                  ),
                ),
              ),
              if (_error != null) ...[
                const SizedBox(height: 12),
                Text(_error!, style: const TextStyle(color: Colors.red)),
              ],
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                height: 48,
                child: FilledButton(
                  onPressed: _loading ? null : _login,
                  child: _loading
                      ? const SizedBox(
                          width: 24,
                          height: 24,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : Text(locale.locale.languageCode == 'om' ? 'Seeni' : 'Login'),
                ),
              ),
              const SizedBox(height: 16),
              TextButton(
                onPressed: () => locale.toggleLocale(),
                child: Text(
                  locale.locale.languageCode == 'om' ? 'English' : 'Afaan Oromoo',
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
