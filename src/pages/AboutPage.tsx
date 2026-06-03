import { m } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
   IconInstagram,
   IconLinkedIn,
   IconMail,
   IconMapPin,
   IconGithub,
   IconWhatsapp,
   IconX,
} from '../components/about/AboutSocialIcons';

const PORTRAIT_SRC = `${import.meta.env.BASE_URL}about/portrait.png`;

const socialLinks = [
   {
      href: 'mailto:viniciusprossi18@gmail.com',
      labelKey: 'social.email' as const,
      description: 'viniciusprossi18@gmail.com',
      Icon: IconMail,
      external: false as const,
   },
   {
      href: 'https://wa.me/5534992150307',
      labelKey: 'social.whatsapp' as const,
      description: '(34) 99215-0307',
      Icon: IconWhatsapp,
      external: true as const,
   },
   {
      href: 'https://www.instagram.com/virossii/',
      labelKey: 'social.instagram' as const,
      description: '@virossii',
      Icon: IconInstagram,
      external: true as const,
   },
   {
      href: 'https://www.linkedin.com/in/vinicius-pimenta-rossi/',
      labelKey: 'social.linkedin' as const,
      description: 'in/vinicius-pimenta-rossi',
      Icon: IconLinkedIn,
      external: true as const,
   },
   {
      href: 'https://x.com/Vinicius_Rossi5',
      labelKey: 'social.x' as const,
      description: '@Vinicius_Rossi5',
      Icon: IconX,
      external: true as const,
   },
   {
      href: 'https://github.com/VRossi18',
      labelKey: 'social.github' as const,
      description: 'VRossi18',
      Icon: IconGithub,
      external: true as const,
   },
] as const;

export function AboutPage() {
   const { t } = useTranslation('common');

   return (
      <m.section
         aria-label={t('about.sectionAria')}
         className="min-h-[50vh] bg-[var(--bg-color)] px-4 py-10 md:py-14"
         initial={{ opacity: 0 }}
         animate={{ opacity: 1 }}
         exit={{ opacity: 0 }}
         transition={{ duration: 0.28, ease: 'easeOut' }}
      >
         <div className="mx-auto max-w-5xl">
            <div className="grid gap-10 md:grid-cols-[minmax(0,280px)_1fr] md:items-start md:gap-12 lg:grid-cols-[minmax(0,320px)_1fr]">
               <figure className="mx-auto w-full max-w-xs md:mx-0 md:max-w-none">
                  <div className="overflow-hidden rounded-2xl border border-primary/25 bg-card shadow-lg shadow-primary/10">
                     <img
                        src={PORTRAIT_SRC}
                        alt={t('about.portraitAlt')}
                        className="w-full object-cover object-top"
                        width={640}
                        height={853}
                        decoding="async"
                     />
                  </div>
               </figure>

               <div className="min-w-0 space-y-8">
                  <header className="space-y-3">
                     <h1 className="text-4xl font-black tracking-tight text-foreground md:text-5xl">
                        Vinicius Rossi
                     </h1>
                     <p className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                        <IconMapPin className="text-primary" aria-hidden />
                        <span>{t('about.location')}</span>
                     </p>
                  </header>

                  <p className="text-base leading-relaxed text-foreground/90 md:text-lg">
                     {t('about.skillsBody')}
                  </p>

                  <div>
                     <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                        {t('about.contactHeading')}
                     </h2>
                     <ul className="grid gap-2 sm:grid-cols-2">
                        {socialLinks.map(({ href, labelKey, description, Icon, external }) => (
                           <li key={href}>
                              <a
                                 href={href}
                                 {...(external
                                    ? { target: '_blank', rel: 'noopener noreferrer' }
                                    : {})}
                                 className="flex items-center gap-3 rounded-xl border border-border/80 bg-card/50 px-4 py-3 text-left transition hover:border-primary/50 hover:bg-card"
                              >
                                 <Icon className="text-primary" />
                                 <span className="min-w-0">
                                    <span className="block text-sm font-bold text-foreground">
                                       {t(labelKey)}
                                    </span>
                                    <span className="block truncate text-xs text-muted-foreground">
                                       {description}
                                    </span>
                                 </span>
                              </a>
                           </li>
                        ))}
                     </ul>
                  </div>
               </div>
            </div>
         </div>
      </m.section>
   );
}
