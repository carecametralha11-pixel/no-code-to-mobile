import { Link } from 'react-router-dom';
import { Header } from '@/components/Header';
import { LoanSimulator } from '@/components/LoanSimulator';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { NativeFeaturesBanner } from '@/components/NativeFeaturesBanner';
import { 
  Shield, 
  Clock, 
  CreditCard, 
  CheckCircle2, 
  ArrowRight, 
  Star,
  Users,
  TrendingUp,
  FileText,
  Smartphone
} from 'lucide-react';

const features = [
  {
    icon: Clock,
    title: 'Aprovação Rápida',
    description: 'Análise em até 24 horas úteis. Sem burocracia e com resposta imediata.',
  },
  {
    icon: Shield,
    title: 'Segurança Total',
    description: 'Seus dados são protegidos com criptografia de ponta. Total privacidade.',
  },
  {
    icon: CreditCard,
    title: 'Parcelas Fixas',
    description: 'Tabela Price com parcelas que cabem no seu bolso. Sem surpresas.',
  },
  {
    icon: CheckCircle2,
    title: 'Processo Simples',
    description: 'Solicite online, envie documentos e acompanhe tudo pelo app.',
  },
];

const steps = [
  {
    number: '01',
    title: 'Simule',
    description: 'Use nosso simulador para ver quanto você pode pegar emprestado e qual será a parcela.',
    icon: TrendingUp,
  },
  {
    number: '02',
    title: 'Cadastre-se',
    description: 'Crie sua conta e preencha seus dados pessoais, documentos e referências.',
    icon: FileText,
  },
  {
    number: '03',
    title: 'Aguarde Análise',
    description: 'Nossa equipe analisa sua solicitação em até 24 horas úteis.',
    icon: Clock,
  },
  {
    number: '04',
    title: 'Receba o Dinheiro',
    description: 'Após aprovação, o valor é depositado diretamente na sua conta.',
    icon: CreditCard,
  },
];

const testimonials = [
  {
    name: 'Maria Silva',
    role: 'Empresária',
    content: 'Consegui o empréstimo que precisava para expandir meu negócio. Processo rápido e sem burocracia!',
    rating: 5,
  },
  {
    name: 'João Santos',
    role: 'Autônomo',
    content: 'Atendimento excelente e taxas justas. Recomendo para quem precisa de crédito confiável.',
    rating: 5,
  },
  {
    name: 'Ana Oliveira',
    role: 'Professora',
    content: 'Parcelas que couberam no meu orçamento. Muito satisfeita com a transparência do processo.',
    rating: 5,
  },
];

export default function Index() {
  return (
    <div className="min-h-screen bg-background app-container">
      <Header />
      
      {/* Native Features Banner */}
      <div className="container px-4 pt-4">
        <NativeFeaturesBanner />
      </div>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-background" />
        <div className="container relative px-4 py-12 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
                <Star className="h-4 w-4 fill-primary" />
                Mais de 10.000 clientes satisfeitos
              </div>
              <h1 className="text-3xl md:text-4xl lg:text-6xl font-bold tracking-tight">
                Crédito rápido e{' '}
                <span className="text-primary">confiável</span>{' '}
                para realizar seus sonhos
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-lg">
                Empréstimo pessoal com as melhores taxas do mercado. 
                Aprovação em até 24 horas e dinheiro na conta.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="h-14 px-8 text-lg" asChild>
                  <Link to="/simulador">
                    Simular Agora
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button variant="outline" size="lg" className="h-14 px-8 text-lg" asChild>
                  <Link to="/auth?mode=signup">
                    Criar Conta
                  </Link>
                </Button>
              </div>
              <div className="flex flex-wrap items-center gap-4 md:gap-8 pt-4">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                  <span className="text-xs md:text-sm text-muted-foreground">+10.000 clientes</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                  <span className="text-xs md:text-sm text-muted-foreground">100% Seguro</span>
                </div>
                <div className="flex items-center gap-2">
                  <Smartphone className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                  <span className="text-xs md:text-sm text-muted-foreground">100% Online</span>
                </div>
              </div>
            </div>
            <div className="lg:pl-8">
              <LoanSimulator showApplyButton />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 md:py-20 bg-muted/30">
        <div className="container px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              Por que escolher a EmprestAí?
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Oferecemos as melhores condições do mercado com total transparência e segurança.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-6 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <feature.icon className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-12 md:py-20">
        <div className="container px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              Como funciona?
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Processo simples e 100% online. Em poucos passos você tem o dinheiro na conta.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-12 left-full w-full h-0.5 bg-border -translate-x-1/2 z-0" />
                )}
                <div className="relative z-10 text-center">
                  <div className="w-24 h-24 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
                    <step.icon className="h-10 w-10 text-primary" />
                  </div>
                  <div className="text-sm font-bold text-primary mb-2">{step.number}</div>
                  <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                  <p className="text-muted-foreground text-sm">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-12 md:py-20 bg-muted/30">
        <div className="container px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              O que nossos clientes dizem
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Milhares de clientes satisfeitos com nosso atendimento e condições.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-6">"{testimonial.content}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-primary font-semibold">
                        {testimonial.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold">{testimonial.name}</p>
                      <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 md:py-20">
        <div className="container px-4">
          <Card className="border-0 shadow-2xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground overflow-hidden">
            <CardContent className="p-6 md:p-12 lg:p-16 text-center relative">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMtOS45NDEgMC0xOCA4LjA1OS0xOCAxOHM4LjA1OSAxOCAxOCAxOCAxOC04LjA1OSAxOC0xOC04LjA1OS0xOC0xOC0xOHptMCAzMmMtNy43MzIgMC0xNC02LjI2OC0xNC0xNHM2LjI2OC0xNCAxNC0xNCAxNCA2LjI2OCAxNCAxNC02LjI2OCAxNC0xNCAxNHoiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iLjA1Ii8+PC9nPjwvc3ZnPg==')] opacity-20" />
              <div className="relative">
                <h2 className="text-3xl lg:text-5xl font-bold mb-6">
                  Pronto para realizar seus planos?
                </h2>
                <p className="text-xl opacity-90 max-w-2xl mx-auto mb-8">
                  Faça uma simulação agora mesmo e descubra as melhores condições para você.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button size="lg" variant="secondary" className="h-14 px-8 text-lg" asChild>
                    <Link to="/simulador">
                      Simular Empréstimo
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" className="h-14 px-8 text-lg bg-transparent border-white/30 hover:bg-white/10" asChild>
                    <Link to="/auth">
                      Falar com Consultor
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 md:py-12 safe-bottom">
        <div className="container px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                  <span className="text-white font-bold text-lg">$</span>
                </div>
                <span className="font-bold text-xl">EmprestAí</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Crédito rápido e confiável para realizar seus sonhos.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Links Rápidos</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/" className="hover:text-foreground transition-colors">Início</Link></li>
                <li><Link to="/simulador" className="hover:text-foreground transition-colors">Simulador</Link></li>
                <li><Link to="/auth" className="hover:text-foreground transition-colors">Entrar</Link></li>
                <li><Link to="/auth?mode=signup" className="hover:text-foreground transition-colors">Cadastrar</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Institucional</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Sobre Nós</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Termos de Uso</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Política de Privacidade</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Contato</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Contato</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>contato@emprestai.com.br</li>
                <li>(11) 99999-9999</li>
                <li>São Paulo, SP</li>
              </ul>
            </div>
          </div>
          <div className="border-t mt-12 pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} EmprestAí. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
