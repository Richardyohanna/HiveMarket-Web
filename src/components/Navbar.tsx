import { Menu, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';

const navItems = [
  { label: 'Home', href: '#home' },
  { label: 'About', href: '#about' },
  { label: 'How It Works', href: '#features' },
  // { label: 'Shops', href: '#shops' },
  { label: 'FAQ', href: '#faq' },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    // Check initial scroll position
    handleScroll();

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const closeMenu = () => setIsOpen(false);

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{
        duration: 0.5,
        ease: [0.22, 1, 0.36, 1],
      }}
      className={`
        sticky top-0 z-50
        border-b
        transition-all duration-500
        ${
          isScrolled
            ? 'border-white/30 bg-white/70 shadow-[0_8px_30px_rgba(0,0,0,0.06)] backdrop-blur-xl'
            : 'border-gray-100 bg-white'
        }
      `}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-6 lg:px-8">

        {/* Logo */}
        <motion.a
          href="#home"
          onClick={closeMenu}
          className="flex items-center gap-2"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              duration: 0.45,
              delay: 0.1,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-[#008100] text-sm font-extrabold text-white shadow-sm"
          >
            H
          </motion.div>

          <motion.span
            initial={{ x: -8, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{
              duration: 0.45,
              delay: 0.15,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="text-[19px] font-bold tracking-tight text-[#17191c]"
          >
            HiveMarket
          </motion.span>
        </motion.a>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-8 md:flex">
          {navItems.map((item, index) => (
            <motion.a
              key={item.label}
              href={item.href}
              initial={{ y: -8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{
                duration: 0.4,
                delay: 0.15 + index * 0.06,
                ease: [0.22, 1, 0.36, 1],
              }}
              whileHover={{ y: -1 }}
              className="group relative py-2 text-[13px] font-medium text-gray-700 transition-colors duration-200 hover:text-[#008100]"
            >
              {item.label}

              {/* Hover underline */}
              <span
                className="
                  absolute
                  bottom-0
                  left-0
                  h-[2px]
                  w-0
                  rounded-full
                  bg-[#008100]
                  transition-all
                  duration-300
                  group-hover:w-full
                "
              />
            </motion.a>
          ))}
        </nav>

        {/* Desktop CTA */}
        {/*
        <motion.a
          href="#download"
          whileHover={{
            y: -2,
            scale: 1.02,
            boxShadow: '0 8px 20px rgba(0,129,0,0.18)',
          }}
          whileTap={{ scale: 0.97 }}
          className="hidden rounded-md bg-[#008100] px-5 py-2.5 text-[13px] font-semibold text-white md:block"
        >
          Download App
        </motion.a>
        */}

        {/* Mobile Menu Button */}
        <motion.button
          type="button"
          onClick={() => setIsOpen((value) => !value)}
          whileTap={{ scale: 0.9 }}
          className="
            flex
            items-center
            justify-center
            rounded-md
            p-2
            text-gray-800
            transition-colors
            hover:bg-gray-100
            hover:text-[#008100]
            md:hidden
          "
          aria-label={isOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={isOpen}
        >
          <AnimatePresence mode="wait" initial={false}>
            {isOpen ? (
              <motion.div
                key="close"
                initial={{ rotate: -90, opacity: 0, scale: 0.7 }}
                animate={{ rotate: 0, opacity: 1, scale: 1 }}
                exit={{ rotate: 90, opacity: 0, scale: 0.7 }}
                transition={{ duration: 0.2 }}
              >
                <X size={23} />
              </motion.div>
            ) : (
              <motion.div
                key="menu"
                initial={{ rotate: 90, opacity: 0, scale: 0.7 }}
                animate={{ rotate: 0, opacity: 1, scale: 1 }}
                exit={{ rotate: -90, opacity: 0, scale: 0.7 }}
                transition={{ duration: 0.2 }}
              >
                <Menu size={23} />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </div>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{
              duration: 0.3,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="overflow-hidden border-t border-gray-100 bg-white/95 backdrop-blur-xl md:hidden"
          >
            <nav className="mx-auto flex max-w-7xl flex-col px-5 py-4 sm:px-6">
              {navItems.map((item, index) => (
                <motion.a
                  key={item.label}
                  href={item.href}
                  onClick={closeMenu}
                  initial={{ x: -15, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -10, opacity: 0 }}
                  transition={{
                    duration: 0.25,
                    delay: index * 0.05,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  whileTap={{ scale: 0.98 }}
                  className="
                    border-b
                    border-gray-100
                    py-4
                    text-sm
                    font-medium
                    text-gray-700
                    transition-colors
                    duration-200
                    last:border-0
                    hover:text-[#008100]
                  "
                >
                  {item.label}
                </motion.a>
              ))}

              {/* Mobile CTA */}
              {/*
              <motion.a
                href="#download"
                onClick={closeMenu}
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{
                  duration: 0.3,
                  delay: navItems.length * 0.05,
                }}
                whileTap={{ scale: 0.97 }}
                className="mt-4 rounded-md bg-[#008100] px-5 py-3 text-center text-sm font-semibold text-white"
              >
                Download App
              </motion.a>
              */}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
