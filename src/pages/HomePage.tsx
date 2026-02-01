import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Trophy, 
  BookOpen, 
  Users, 
  Heart, 
  Bookmark, 
  Search,
  Gamepad2,
  Target,
  Star,
  ArrowRight,
  CheckCircle
} from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { SteamLoginButton } from '@/components';

/**
 * Home Page
 * Landing page with information about the site and its features
 */

export function HomePage() {
  const { t } = useTranslation();
  const { isAuthenticated, user } = useAuthStore();

  const features = [
    {
      icon: Trophy,
      title: 'Conquistas Steam',
      description: 'Acompanhe seu progresso em conquistas de todos os seus jogos Steam. Veja estatísticas detalhadas e conquistas raras.',
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
    },
    {
      icon: BookOpen,
      title: 'Guias da Comunidade',
      description: 'Crie e compartilhe guias de conquistas com a comunidade. Ajude outros jogadores a conquistar 100% nos jogos.',
      color: 'text-steam-accent',
      bgColor: 'bg-steam-accent/10',
    },
    {
      icon: Heart,
      title: 'Curtir e Salvar',
      description: 'Curta os melhores guias e salve para acessar depois. Encontre facilmente os guias mais úteis da comunidade.',
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
    },
    {
      icon: Target,
      title: 'Progresso Detalhado',
      description: 'Visualize seu progresso por jogo com barras de conclusão, conquistas faltantes e tempo para completar.',
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
  ];

  const stats = [
    { value: '50K+', label: 'Jogos Suportados' },
    { value: '∞', label: 'Conquistas Disponíveis' },
    { value: '100%', label: 'Gratuito' },
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)]">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-steam-darker via-steam-blue to-steam-dark overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-steam-accent rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500 rounded-full blur-3xl" />
        </div>
        
        <div className="container mx-auto px-4 py-20 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            {/* Logo */}
            <div className="flex items-center justify-center gap-3 mb-6">
              <Gamepad2 className="w-16 h-16 text-steam-accent" />
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
              Steam <span className="text-steam-accent">Ally</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Seu companheiro definitivo para conquistas Steam e guias da comunidade
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              {isAuthenticated ? (
                <>
                  <Link
                    to={`/profile/${user?.steamId}`}
                    className="flex items-center gap-2 px-8 py-4 bg-steam-accent text-white font-semibold rounded-xl hover:bg-steam-accent-dark transition-all shadow-lg shadow-steam-accent/25"
                  >
                    <Trophy className="w-5 h-5" />
                    Ver Minhas Conquistas
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                  <Link
                    to="/community-guides"
                    className="flex items-center gap-2 px-8 py-4 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 transition-all backdrop-blur-sm border border-white/20"
                  >
                    <BookOpen className="w-5 h-5" />
                    Explorar Guias
                  </Link>
                </>
              ) : (
                <>
                  <SteamLoginButton size="lg" />
                  <Link
                    to="/community-guides"
                    className="flex items-center gap-2 px-8 py-4 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 transition-all backdrop-blur-sm border border-white/20"
                  >
                    <BookOpen className="w-5 h-5" />
                    Explorar Guias
                  </Link>
                </>
              )}
            </div>

            {/* Stats */}
            <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <p className="text-3xl md:text-4xl font-bold text-white">{stat.value}</p>
                  <p className="text-gray-400">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50 dark:bg-steam-darker">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Tudo que você precisa para suas conquistas
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Ferramentas poderosas para acompanhar, planejar e compartilhar seu progresso em conquistas Steam
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="p-6 bg-white dark:bg-steam-dark rounded-2xl shadow-lg hover:shadow-xl transition-shadow border border-gray-100 dark:border-steam-darker"
              >
                <div className={`w-14 h-14 ${feature.bgColor} rounded-xl flex items-center justify-center mb-4`}>
                  <feature.icon className={`w-7 h-7 ${feature.color}`} />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-white dark:bg-steam-dark">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Como funciona
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Comece a usar em poucos passos
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  step: '1',
                  title: 'Entre com Steam',
                  description: 'Faça login seguro com sua conta Steam para acessar suas conquistas e jogos.',
                  icon: Users,
                },
                {
                  step: '2',
                  title: 'Explore seus jogos',
                  description: 'Veja todas as conquistas dos seus jogos, progresso e estatísticas detalhadas.',
                  icon: Search,
                },
                {
                  step: '3',
                  title: 'Crie e compartilhe',
                  description: 'Crie guias para ajudar outros jogadores ou use guias da comunidade.',
                  icon: Star,
                },
              ].map((item, index) => (
                <div key={index} className="text-center">
                  <div className="relative inline-flex items-center justify-center w-16 h-16 bg-steam-accent text-white text-2xl font-bold rounded-full mb-4">
                    {item.step}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    {item.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-gradient-to-br from-steam-accent/10 to-purple-500/10 dark:from-steam-accent/5 dark:to-purple-500/5">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">
                  Por que usar o Steam Ally?
                </h2>
                <ul className="space-y-4">
                  {[
                    'Visualização clara do progresso em conquistas',
                    'Guias escritos pela comunidade de jogadores',
                    'Sistema de curtidas e salvos para os melhores guias',
                    'Filtros por jogo para encontrar guias específicos',
                    'Totalmente gratuito e sem anúncios',
                    'Design moderno e responsivo',
                  ].map((benefit, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 dark:text-gray-300">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="bg-white dark:bg-steam-dark rounded-2xl shadow-2xl p-8 border border-gray-100 dark:border-steam-darker">
                <div className="text-center">
                  <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Pronto para começar?
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Entre com sua conta Steam e comece a acompanhar suas conquistas agora mesmo.
                  </p>
                  {isAuthenticated ? (
                    <Link
                      to={`/profile/${user?.steamId}`}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-steam-accent text-white font-semibold rounded-lg hover:bg-steam-accent-dark transition-all"
                    >
                      Ver Meu Perfil
                      <ArrowRight className="w-5 h-5" />
                    </Link>
                  ) : (
                    <SteamLoginButton />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-16 bg-steam-darker">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-400 mb-4">
            Feito com ❤️ para a comunidade Steam
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              to="/community-guides"
              className="text-steam-accent hover:underline"
            >
              Explorar Guias
            </Link>
            <span className="text-gray-600">•</span>
            <a
              href="https://store.steampowered.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-steam-accent hover:underline"
            >
              Steam Store
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
