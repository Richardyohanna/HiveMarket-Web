
import { motion, useReducedMotion } from 'framer-motion';

import heroImage from '../assets/happy-user.png';
import DownloadCta from './DownloadCta';

const steps = [
  {
    number: 1,
    title: 'Discover',
    description: 'Explore shops and products around your campus.',
  },
  {
    number: 2,
    title: 'Connect',
    description: 'Chat with shop owners and make your inquiries.',
  },
  {
    number: 3,
    title: 'Shop',
    description: 'Get what you need and support local businesses.',
  },
];

export default function HowItWorks() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section
      id="features"
      className="relative scroll-mt-20 overflow-hidden bg-white py-20 sm:py-24 md:scroll-mt-16"
    >
      {/* =====================================================
          Decorative Background Elements
      ====================================================== */}

      {!shouldReduceMotion && (
        <>
          <motion.div
            className="
              pointer-events-none
              absolute
              -left-24
              top-[35%]
              h-56
              w-56
              rounded-full
              bg-[#e8f5e9]/40
              blur-3xl
            "
            animate={{
              y: [0, -20, 0],
              x: [0, 15, 0],
              scale: [1, 1.05, 1],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />

          <motion.div
            className="
              pointer-events-none
              absolute
              right-[8%]
              bottom-[18%]
              h-3
              w-3
              rounded-full
              bg-[#008100]/10
            "
            animate={{
              y: [0, -18, 0],
              opacity: [0.3, 0.8, 0.3],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        </>
      )}

      <div className="relative z-10 mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        <div className="grid items-center gap-14 lg:grid-cols-2">

          {/* ===================================================
              Left Side
          ==================================================== */}

          <motion.div
            initial={
              shouldReduceMotion
                ? { opacity: 1 }
                : {
                    opacity: 0,
                    x: -35,
                  }
            }
            whileInView={
              shouldReduceMotion
                ? { opacity: 1 }
                : {
                    opacity: 1,
                    x: 0,
                  }
            }
            viewport={{
              once: true,
              amount: 0.25,
            }}
            transition={{
              duration: 0.7,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            {/* Heading */}

            <motion.h2
              initial={
                shouldReduceMotion
                  ? { opacity: 1 }
                  : {
                      opacity: 0,
                      y: 20,
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
                text-3xl
                font-extrabold
                leading-tight
                tracking-[-1px]
                text-[#17191c]
                sm:text-4xl
                lg:text-[44px]
              "
            >
              How it
              <span className="text-[#008100]">
                {' '}works.
              </span>
            </motion.h2>

            {/* =================================================
                Steps
            ================================================== */}

            <ol className="relative mt-10">
              {steps.map((step, index) => (
                <motion.li
                  key={step.number}
                  initial={
                    shouldReduceMotion
                      ? { opacity: 1 }
                      : {
                          opacity: 0,
                          x: -25,
                        }
                  }
                  whileInView={
                    shouldReduceMotion
                      ? { opacity: 1 }
                      : {
                          opacity: 1,
                          x: 0,
                        }
                  }
                  viewport={{
                    once: true,
                    amount: 0.3,
                  }}
                  transition={{
                    duration: 0.55,
                    delay: 0.2 + index * 0.15,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="
                    relative
                    flex
                    gap-5
                    pb-8
                    last:pb-0
                  "
                >
                  {/* Timeline */}

                  {index !== steps.length - 1 && (
                    <motion.span
                      initial={
                        shouldReduceMotion
                          ? { scaleY: 1 }
                          : {
                              scaleY: 0,
                            }
                      }
                      whileInView={{
                        scaleY: 1,
                      }}
                      viewport={{
                        once: true,
                        amount: 0.3,
                      }}
                      transition={{
                        duration: 0.65,
                        delay: 0.35 + index * 0.15,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                      style={{
                        transformOrigin: 'top',
                      }}
                      className="
                        absolute
                        left-[19px]
                        top-10
                        h-[calc(100%-1.5rem)]
                        w-px
                        border-l-2
                        border-dashed
                        border-[#008100]/30
                      "
                      aria-hidden="true"
                    />
                  )}

                  {/* Number */}

                  <motion.span
                    initial={
                      shouldReduceMotion
                        ? {
                            opacity: 1,
                            scale: 1,
                          }
                        : {
                            opacity: 0,
                            scale: 0.65,
                          }
                    }
                    whileInView={
                      shouldReduceMotion
                        ? {
                            opacity: 1,
                            scale: 1,
                          }
                        : {
                            opacity: 1,
                            scale: 1,
                          }
                    }
                    viewport={{
                      once: true,
                      amount: 0.3,
                    }}
                    transition={{
                      type: 'spring',
                      stiffness: 260,
                      damping: 18,
                      delay: 0.25 + index * 0.15,
                    }}
                    whileHover={
                      shouldReduceMotion
                        ? undefined
                        : {
                            scale: 1.1,
                            boxShadow:
                              '0 8px 20px rgba(0,129,0,0.18)',
                          }
                    }
                    className="
                      relative
                      z-10
                      flex
                      h-10
                      w-10
                      shrink-0
                      items-center
                      justify-center
                      rounded-full
                      bg-[#008100]
                      text-base
                      font-bold
                      text-white
                      shadow-sm
                      transition-shadow
                      duration-300
                    "
                  >
                    {step.number}
                  </motion.span>

                  {/* Step Content */}

                  <motion.div
                    initial={
                      shouldReduceMotion
                        ? { opacity: 1 }
                        : {
                            opacity: 0,
                            y: 8,
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
                      duration: 0.45,
                      delay: 0.3 + index * 0.15,
                    }}
                    className="pt-1"
                  >
                    <h3 className="text-base font-bold text-[#17191c]">
                      {step.title}
                    </h3>

                    <p className="mt-1 max-w-xs text-sm leading-6 text-[#697078]">
                      {step.description}
                    </p>
                  </motion.div>
                </motion.li>
              ))}
            </ol>
          </motion.div>

          {/* ===================================================
              Right Side
          ==================================================== */}

          <motion.div
            initial={
              shouldReduceMotion
                ? { opacity: 1 }
                : {
                    opacity: 0,
                    x: 35,
                  }
            }
            whileInView={
              shouldReduceMotion
                ? { opacity: 1 }
                : {
                    opacity: 1,
                    x: 0,
                  }
            }
            viewport={{
              once: true,
              amount: 0.2,
            }}
            transition={{
              duration: 0.8,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="
              relative
              mx-auto
              h-[300px]
              w-full
              md:h-[450px]
            "
          >
            {/* =================================================
                Decorative Circle
            ================================================== */}

            <motion.div
              initial={
                shouldReduceMotion
                  ? {
                      opacity: 1,
                      scale: 1,
                    }
                  : {
                      opacity: 0,
                      scale: 0.8,
                    }
              }
              whileInView={
                shouldReduceMotion
                  ? {
                      opacity: 1,
                      scale: 1,
                    }
                  : {
                      opacity: 1,
                      scale: 1,
                    }
              }
              viewport={{
                once: true,
                amount: 0.2,
              }}
              animate={
                shouldReduceMotion
                  ? undefined
                  : {
                      y: [0, -10, 0],
                      scale: [1, 1.03, 1],
                    }
              }
              transition={
                shouldReduceMotion
                  ? {
                      duration: 0.6,
                    }
                  : {
                      duration: 8,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }
              }
              className="
                pointer-events-none
                absolute
                right-25
                -top-4
                h-72
                w-72
                rounded-full
                bg-[#e8f5e9]
                md:h-80
                md:w-80
                
              "
            />

            {/* =================================================
                Soft Glow
            ================================================== */}

            <motion.div
              initial={{
                opacity: 0,
              }}
              whileInView={{
                opacity: shouldReduceMotion ? 0.25 : [0.2, 0.35, 0.2],
              }}
              viewport={{
                once: true,
                amount: 0.2,
              }}
              transition={
                shouldReduceMotion
                  ? {
                      duration: 0.5,
                    }
                  : {
                      duration: 5,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }
              }
              className="
                pointer-events-none
                absolute
                bottom-2
                left-1/2
                h-20
                w-[65%]
                -translate-x-1/2
                rounded-[50%]
                bg-[#008100]/10
                blur-3xl
              "
            />

            {/* =================================================
                Hero Image
            ================================================== */}

            <motion.img
              src={heroImage}
              alt="Student browsing HiveMarket on his phone"
              initial={
                shouldReduceMotion
                  ? {
                      opacity: 1,
                      y: 0,
                      scale: 1,
                    }
                  : {
                      opacity: 0,
                      y: 35,
                      scale: 0.97,
                    }
              }
              whileInView={
                shouldReduceMotion
                  ? {
                      opacity: 1,
                      y: 0,
                      scale: 1,
                    }
                  : {
                      opacity: 1,
                      y: 0,
                      scale: 1,
                    }
              }
              viewport={{
                once: true,
                amount: 0.2,
              }}
              animate={
                shouldReduceMotion
                  ? undefined
                  : {
                      y: [0, -8, 0],
                    }
              }
              transition={
                shouldReduceMotion
                  ? {
                      duration: 0.7,
                      ease: [0.22, 1, 0.36, 1],
                    }
                  : {
                      y: {
                        duration: 5,
                        repeat: 1,
                        ease: 'easeInOut',
                      },
                      opacity: {
                        duration: 0.7,
                        ease: [0.22, 1, 0.36, 1],
                      },
                      scale: {
                        duration: 0.7,
                        ease: [0.22, 1, 0.36, 1],
                      },
                    }
              }
              className="
                absolute
                inset-x-0
                bottom-0
                mx-auto
                h-full
                w-full
                object-cover
                object-bottom
              "
            />


          </motion.div>
        </div>
      </div>

      {/* =====================================================
          Download CTA
      ====================================================== */}

      <motion.div
        initial={
          shouldReduceMotion
            ? { opacity: 1, y: 0 }
            : {
                opacity: 0,
                y: 30,
              }
        }
        whileInView={
          shouldReduceMotion
            ? {
                opacity: 1,
                y: 0,
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
          duration: 0.7,
          ease: [0.22, 1, 0.36, 1],
        }}
      >
        <DownloadCta />
      </motion.div>
    </section>
  );
}
