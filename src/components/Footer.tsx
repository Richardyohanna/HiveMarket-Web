
import { ArrowUpRight } from 'lucide-react';
import {
  FaFacebookF,
  FaInstagram,
  FaTwitter,
} from 'react-icons/fa';
import { motion, useReducedMotion } from 'framer-motion';

const footerLinks = [
  { label: 'Home', href: '#home' },
  { label: 'About', href: '#about' },
  { label: 'Features', href: '#features' },
  { label: 'FAQ', href: '#faq' },
];

export default function Footer() {
  const shouldReduceMotion = useReducedMotion();

  const columnVariants = {
    hidden: {
      opacity: 0,
      y: 25,
    },
    visible: {
      opacity: 1,
      y: 0,
    },
  };

  return (
    <footer className="relative overflow-hidden border-t border-[#e7ece8] bg-[#ffffff]">

      {/* Decorative glow */}
      {/* <motion.div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          -right-32
          -top-32
          h-72
          w-72
          rounded-full
          bg-[#e8f5e9]
          blur-3xl
        "
        animate={
          shouldReduceMotion
            ? undefined
            : {
                x: [0, -20, 0],
                y: [0, 15, 0],
                scale: [1, 1.08, 1],
              }
        }
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      /> */}

      <div className="relative mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">

        {/* Main footer */}
        <motion.div
          className="grid gap-12 py-14 md:grid-cols-[1.5fr_1fr_1fr] lg:py-16"
          initial={shouldReduceMotion ? false : 'hidden'}
          whileInView={shouldReduceMotion ? undefined : 'visible'}
          viewport={{ once: true, amount: 0.15 }}
          transition={{
            staggerChildren: 0.12,
          }}
        >

          {/* Brand */}
          <motion.div
            variants={columnVariants}
            transition={{
              duration: 0.65,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="max-w-sm"
          >
            <motion.a
              href="#home"
              className="inline-flex items-center gap-2"
              whileHover={
                shouldReduceMotion
                  ? undefined
                  : {
                      y: -2,
                    }
              }
              whileTap={
                shouldReduceMotion
                  ? undefined
                  : {
                      scale: 0.97,
                    }
              }
            >
              <motion.div
                className="
                  flex
                  h-9
                  w-9
                  items-center
                  justify-center
                  rounded-[10px]
                  bg-[#008100]
                  text-sm
                  font-extrabold
                  text-white
                "
                whileHover={
                  shouldReduceMotion
                    ? undefined
                    : {
                        rotate: -5,
                        scale: 1.05,
                      }
                }
                transition={{
                  type: 'spring',
                  stiffness: 300,
                  damping: 15,
                }}
              >
                H
              </motion.div>

              <span className="text-xl font-bold tracking-tight text-[#17191c]">
                HiveMarket
              </span>
            </motion.a>

            <p className="mt-5 text-sm leading-7 text-[#697078]">
              Discover local shops, explore products, connect with
              shop owners, and shop smarter within your community.
            </p>

            {/* Social links */}
            <motion.div
              className="mt-6 flex items-center gap-2"
              variants={{
                hidden: {},
                visible: {
                  transition: {
                    staggerChildren: 0.08,
                  },
                },
              }}
            >
              {/* Facebook */}
              <motion.a
                href="#"
                aria-label="Facebook"
                variants={{
                  hidden: {
                    opacity: 0,
                    scale: 0.7,
                    y: 10,
                  },
                  visible: {
                    opacity: 1,
                    scale: 1,
                    y: 0,
                  },
                }}
                whileHover={
                  shouldReduceMotion
                    ? undefined
                    : {
                        y: -4,
                        scale: 1.08,
                      }
                }
                whileTap={
                  shouldReduceMotion
                    ? undefined
                    : {
                        scale: 0.92,
                      }
                }
                transition={{
                  type: 'spring',
                  stiffness: 350,
                  damping: 18,
                }}
                className="
                  flex
                  h-9
                  w-9
                  items-center
                  justify-center
                  rounded-full
                  border
                  border-[#dce5de]
                  bg-white
                  text-[#697078]
                  transition-colors
                  duration-300
                  hover:border-[#008100]
                  hover:bg-[#008100]
                  hover:text-white
                "
              >
                <FaFacebookF size={16} />
              </motion.a>

              {/* Instagram */}
              <motion.a
                href="#"
                aria-label="Instagram"
                variants={{
                  hidden: {
                    opacity: 0,
                    scale: 0.7,
                    y: 10,
                  },
                  visible: {
                    opacity: 1,
                    scale: 1,
                    y: 0,
                  },
                }}
                whileHover={
                  shouldReduceMotion
                    ? undefined
                    : {
                        y: -4,
                        scale: 1.08,
                      }
                }
                whileTap={
                  shouldReduceMotion
                    ? undefined
                    : {
                        scale: 0.92,
                      }
                }
                transition={{
                  type: 'spring',
                  stiffness: 350,
                  damping: 18,
                }}
                className="
                  flex
                  h-9
                  w-9
                  items-center
                  justify-center
                  rounded-full
                  border
                  border-[#dce5de]
                  bg-white
                  text-[#697078]
                  transition-colors
                  duration-300
                  hover:border-[#008100]
                  hover:bg-[#008100]
                  hover:text-white
                "
              >
                <FaInstagram size={16} />
              </motion.a>

              {/* Twitter */}
              <motion.a
                href="#"
                aria-label="Twitter"
                variants={{
                  hidden: {
                    opacity: 0,
                    scale: 0.7,
                    y: 10,
                  },
                  visible: {
                    opacity: 1,
                    scale: 1,
                    y: 0,
                  },
                }}
                whileHover={
                  shouldReduceMotion
                    ? undefined
                    : {
                        y: -4,
                        scale: 1.08,
                      }
                }
                whileTap={
                  shouldReduceMotion
                    ? undefined
                    : {
                        scale: 0.92,
                      }
                }
                transition={{
                  type: 'spring',
                  stiffness: 350,
                  damping: 18,
                }}
                className="
                  flex
                  h-9
                  w-9
                  items-center
                  justify-center
                  rounded-full
                  border
                  border-[#dce5de]
                  bg-white
                  text-[#697078]
                  transition-colors
                  duration-300
                  hover:border-[#008100]
                  hover:bg-[#008100]
                  hover:text-white
                "
              >
                <FaTwitter size={16} />
              </motion.a>
            </motion.div>
          </motion.div>

          {/* Navigation */}
          <motion.div
            variants={columnVariants}
            transition={{
              duration: 0.65,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            <h3 className="text-sm font-bold text-[#17191c]">
              Navigation
            </h3>

            <motion.nav
              className="mt-5 flex flex-col gap-3"
              variants={{
                hidden: {},
                visible: {
                  transition: {
                    staggerChildren: 0.08,
                  },
                },
              }}
            >
              {footerLinks.map((link) => (
                <motion.a
                  key={link.label}
                  href={link.href}
                  variants={{
                    hidden: {
                      opacity: 0,
                      x: -10,
                    },
                    visible: {
                      opacity: 1,
                      x: 0,
                    },
                  }}
                  whileHover={
                    shouldReduceMotion
                      ? undefined
                      : {
                          x: 4,
                        }
                  }
                  className="
                    w-fit
                    text-sm
                    text-[#697078]
                    transition-colors
                    duration-200
                    hover:text-[#008100]
                  "
                >
                  {link.label}
                </motion.a>
              ))}
            </motion.nav>
          </motion.div>

          {/* Download */}
          <motion.div
            variants={columnVariants}
            transition={{
              duration: 0.65,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            <h3 className="text-sm font-bold text-[#17191c]">
              Get HiveMarket
            </h3>

            <p className="mt-5 text-sm leading-6 text-[#697078]">
              Take your local marketplace with you wherever you go.
            </p>

            <motion.a
              href="#download"
              whileHover={
                shouldReduceMotion
                  ? undefined
                  : {
                      x: 3,
                    }
              }
              className="
                mt-5
                inline-flex
                items-center
                gap-2
                text-sm
                font-semibold
                text-[#008100]
                transition-colors
                hover:text-[#006d24]
              "
            >
              <span>Download the app</span>

              <motion.span
                animate={
                  shouldReduceMotion
                    ? undefined
                    : {
                        x: [0, 3, 0],
                        y: [0, -2, 0],
                      }
                }
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatDelay: 2,
                  ease: 'easeInOut',
                }}
              >
                <ArrowUpRight size={16} />
              </motion.span>
            </motion.a>
          </motion.div>

        </motion.div>

        {/* Bottom */}
        <motion.div
          className="
            flex
            flex-col
            gap-4
            border-t
            border-[#dfe7e1]
            py-6
            sm:flex-row
            sm:items-center
            sm:justify-between
          "
          initial={
            shouldReduceMotion
              ? false
              : {
                  opacity: 0,
                  y: 15,
                }
          }
          whileInView={
            shouldReduceMotion
              ? undefined
              : {
                  opacity: 1,
                  y: 0,
                }
          }
          viewport={{ once: true, amount: 0.3 }}
          transition={{
            duration: 0.6,
            delay: 0.15,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          <p className="text-xs text-[#7a8289]">
            © {new Date().getFullYear()} HiveMarket. All rights reserved.
          </p>

          <div className="flex items-center gap-5">
            <motion.a
              href="#"
              whileHover={
                shouldReduceMotion
                  ? undefined
                  : {
                      y: -1,
                    }
              }
              className="
                text-xs
                text-[#7a8289]
                transition-colors
                hover:text-[#008100]
              "
            >
              Privacy Policy
            </motion.a>

            <motion.a
              href="#"
              whileHover={
                shouldReduceMotion
                  ? undefined
                  : {
                      y: -1,
                    }
              }
              className="
                text-xs
                text-[#7a8289]
                transition-colors
                hover:text-[#008100]
              "
            >
              Terms of Service
            </motion.a>
          </div>
        </motion.div>

      </div>
    </footer>
  );
}
