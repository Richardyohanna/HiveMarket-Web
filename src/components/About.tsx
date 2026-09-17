import {
  Compass,
  MapPin,
  MessageCircle,
  ShoppingBag,
} from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';

const benefits = [
  {
    icon: Compass,
    title: 'Discover Nearby',
    description:
      'Find shops, products, and businesses around your community without having to search everywhere.',
  },
  {
    icon: ShoppingBag,
    title: 'Explore Products',
    description:
      'Browse what local shops have to offer and discover products that match what you are looking for.',
  },
  {
    icon: MessageCircle,
    title: 'Connect Directly',
    description:
      'Get closer to local shop owners and communicate directly when you need more information.',
  },
  {
    icon: MapPin,
    title: 'Shop Locally',
    description:
      'Know what is available around you and make smarter decisions about where to shop.',
  },
];

export default function About() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section
      id="about"
      className="relative scroll-mt-20 overflow-hidden bg-[#ffffff] py-20 sm:py-24 md:scroll-mt-16"
    >
      {/* =====================================================
          Decorative Background
      ====================================================== */}

      {!shouldReduceMotion && (
        <>
          {/* Soft floating bubble */}
          <motion.div
            className="
              pointer-events-none
              absolute
              -left-10
              top-24
              h-32
              w-32
              rounded-full
              bg-[#e8f5e9]/60
              blur-2xl
            "
            animate={{
              y: [0, -20, 0],
              x: [0, 10, 0],
              scale: [1, 1.05, 1],
            }}
            transition={{
              duration: 9,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />

          {/* Small floating dot */}
          <motion.div
            className="
              pointer-events-none
              absolute
              right-[12%]
              top-[28%]
              h-3
              w-3
              rounded-full
              bg-[#008100]/10
            "
            animate={{
              y: [0, -15, 0],
              opacity: [0.3, 0.7, 0.3],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />

          {/* Bottom decorative bubble */}
          <motion.div
            className="
              pointer-events-none
              absolute
              -right-20
              bottom-10
              h-44
              w-44
              rounded-full
              bg-[#e8f5e9]/40
              blur-3xl
            "
            animate={{
              y: [0, 15, 0],
              scale: [1, 1.08, 1],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        </>
      )}

      <div className="relative z-10 mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">

        {/* =====================================================
            Section Heading
        ====================================================== */}

        <motion.div
          initial={
            shouldReduceMotion
              ? { opacity: 1 }
              : {
                  opacity: 0,
                  y: 30,
                }
          }
          whileInView={
            shouldReduceMotion
              ? { opacity: 1 }
              : {
                  opacity: 1,
                  y: 0,
                }
          }
          viewport={{
            once: true,
            amount: 0.3,
          }}
          transition={{
            duration: 0.7,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="mx-auto max-w-2xl text-center"
        >
          <motion.h2
            initial={
              shouldReduceMotion
                ? { opacity: 1 }
                : {
                    opacity: 0,
                    y: 15,
                  }
            }
            whileInView={
              shouldReduceMotion
                ? { opacity: 1 }
                : {
                    opacity: 1,
                    y: 0,
                  }
            }
            viewport={{
              once: true,
              amount: 0.3,
            }}
            transition={{
              duration: 0.6,
              delay: 0.1,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="
              mt-4
              text-3xl
              font-extrabold
              leading-tight
              tracking-[-1px]
              text-[#17191c]
              sm:text-4xl
              lg:text-[44px]
            "
          >
            Your Community,
            <span className="text-[#008100]">
              {' '}Connected.
            </span>
          </motion.h2>

          <motion.p
            initial={
              shouldReduceMotion
                ? { opacity: 1 }
                : {
                    opacity: 0,
                    y: 15,
                  }
            }
            whileInView={
              shouldReduceMotion
                ? { opacity: 1 }
                : {
                    opacity: 1,
                    y: 0,
                  }
            }
            viewport={{
              once: true,
              amount: 0.3,
            }}
            transition={{
              duration: 0.6,
              delay: 0.2,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="
              mx-auto
              mt-5
              max-w-xl
              text-[15px]
              leading-7
              text-[#5b6269]
              sm:text-base
            "
          >
            HiveMarket makes it easier to discover local shops, explore
            products, connect with shop owners, and find what you need
            around you — all in one place.
          </motion.p>
        </motion.div>

        {/* =====================================================
            Benefits
        ====================================================== */}

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;

            return (
              <motion.div
                key={benefit.title}
                initial={
                  shouldReduceMotion
                    ? {
                        opacity: 1,
                      }
                    : {
                        opacity: 0,
                        y: 35,
                      }
                }
                whileInView={
                  shouldReduceMotion
                    ? {
                        opacity: 1,
                      }
                    : {
                        opacity: 1,
                        y: 0,
                      }
                }
                viewport={{
                  once: true,
                  amount: 0.2,
                }}
                transition={{
                  duration: 0.6,
                  delay: index * 0.1,
                  ease: [0.22, 1, 0.36, 1],
                }}
                whileHover={
                  shouldReduceMotion
                    ? undefined
                    : {
                        y: -6,
                        transition: {
                          duration: 0.25,
                        },
                      }
                }
                className="
                  group
                  rounded-2xl
                  border
                  border-[#e7ece8]
                  bg-white
                  p-6
                  shadow-[0_8px_30px_rgba(0,0,0,0.03)]
                  transition-all
                  duration-300
                  hover:border-[#cce5cf]
                  hover:shadow-[0_18px_40px_rgba(0,0,0,0.07)]
                "
                data-interactive
              >
                {/* =================================================
                    Icon
                ================================================== */}

                <motion.div
                  initial={
                    shouldReduceMotion
                      ? {
                          opacity: 1,
                          scale: 1,
                          rotate: 0,
                        }
                      : {
                          opacity: 0,
                          scale: 0.7,
                          rotate: -8,
                        }
                  }
                  whileInView={
                    shouldReduceMotion
                      ? {
                          opacity: 1,
                          scale: 1,
                          rotate: 0,
                        }
                      : {
                          opacity: 1,
                          scale: 1,
                          rotate: 0,
                        }
                  }
                  viewport={{
                    once: true,
                    amount: 0.2,
                  }}
                  transition={{
                    duration: 0.5,
                    delay: 0.15 + index * 0.1,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  whileHover={
                    shouldReduceMotion
                      ? undefined
                      : {
                          scale: 1.08,
                          rotate: 4,
                          transition: {
                            duration: 0.2,
                          },
                        }
                  }
                  className="
                    flex
                    h-11
                    w-11
                    items-center
                    justify-center
                    rounded-xl
                    bg-[#e8f5e9]
                    text-[#008100]
                    transition-colors
                    duration-300
                    group-hover:bg-[#008100]
                    group-hover:text-white
                  "
                >
                  <Icon
                    size={21}
                    strokeWidth={2}
                  />
                </motion.div>

                {/* =================================================
                    Title
                ================================================== */}

                <motion.h3
                  initial={
                    shouldReduceMotion
                      ? {
                          opacity: 1,
                        }
                      : {
                          opacity: 0,
                          y: 10,
                        }
                  }
                  whileInView={
                    shouldReduceMotion
                      ? {
                          opacity: 1,
                        }
                      : {
                          opacity: 1,
                          y: 0,
                        }
                  }
                  viewport={{
                    once: true,
                    amount: 0.2,
                  }}
                  transition={{
                    duration: 0.45,
                    delay: 0.2 + index * 0.1,
                  }}
                  className="mt-5 text-base font-bold text-[#17191c]"
                >
                  {benefit.title}
                </motion.h3>

                {/* =================================================
                    Description
                ================================================== */}

                <motion.p
                  initial={
                    shouldReduceMotion
                      ? {
                          opacity: 1,
                        }
                      : {
                          opacity: 0,
                          y: 8,
                        }
                  }
                  whileInView={
                    shouldReduceMotion
                      ? {
                          opacity: 1,
                        }
                      : {
                          opacity: 1,
                          y: 0,
                        }
                  }
                  viewport={{
                    once: true,
                    amount: 0.2,
                  }}
                  transition={{
                    duration: 0.45,
                    delay: 0.25 + index * 0.1,
                  }}
                  className="mt-2 text-sm leading-6 text-[#697078]"
                >
                  {benefit.description}
                </motion.p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
