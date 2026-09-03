
import androidIcon from '../assets/android-icon.png';
import iosIcon from '../assets/ios-icon.png';
import explore from '../assets/explore.png';

import { motion, useReducedMotion } from 'framer-motion';

export default function DownloadCta() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section className="bg-white px-5 sm:px-6">
      <div className="mx-auto max-w-7xl">

        {/* =====================================================
            CTA Container
        ====================================================== */}

        <motion.div
          initial={
            shouldReduceMotion
              ? {
                  opacity: 1,
                  y: 0,
                }
              : {
                  opacity: 0,
                  y: 35,
                }
          }
          whileInView={{
            opacity: 1,
            y: 0,
          }}
          viewport={{
            once: true,
            amount: 0.25,
          }}
          transition={{
            duration: 0.75,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="
            relative
            isolate
            overflow-hidden
            rounded-3xl
            bg-[#0a5c00]
            px-6
            py-10
            sm:px-10
            sm:py-12
            lg:px-12
          "
        >

          {/* ===================================================
              Ambient Glow
          ==================================================== */}

          <motion.div
            animate={
              shouldReduceMotion
                ? {
                    opacity: 0.6,
                    scale: 1,
                  }
                : {
                    opacity: [0.45, 0.7, 0.45],
                    scale: [1, 1.08, 1],
                  }
            }
            transition={
              shouldReduceMotion
                ? {
                    duration: 0,
                  }
                : {
                    duration: 7,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }
            }
            className="
              pointer-events-none
              absolute
              -right-24
              -top-32
              h-72
              w-72
              rounded-full
              bg-[#008100]
              blur-3xl
            "
            aria-hidden="true"
          />

          {/* Secondary glow */}

          {!shouldReduceMotion && (
            <motion.div
              animate={{
                x: [0, 20, 0],
                y: [0, -10, 0],
                opacity: [0.15, 0.3, 0.15],
              }}
              transition={{
                duration: 9,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="
                pointer-events-none
                absolute
                -bottom-20
                left-[25%]
                h-48
                w-48
                rounded-full
                bg-[#72d66b]
                blur-3xl
              "
              aria-hidden="true"
            />
          )}

          {/* ===================================================
              Content
          ==================================================== */}

          <div className="relative flex flex-col items-center gap-10 lg:flex-row lg:gap-12">

            {/* =================================================
                Phone Mockup
            ================================================== */}

            <motion.div
              initial={
                shouldReduceMotion
                  ? {
                      opacity: 1,
                      x: 0,
                      scale: 1,
                    }
                  : {
                      opacity: 0,
                      x: -30,
                      scale: 0.94,
                    }
              }
              whileInView={{
                opacity: 1,
                x: 0,
                scale: 1,
              }}
              viewport={{
                once: true,
                amount: 0.25,
              }}
              animate={
                shouldReduceMotion
                  ? undefined
                  : {
                      y: [0, -7, 0],
                    }
              }
              transition={
                shouldReduceMotion
                  ? {
                      duration: 0.6,
                      ease: [0.22, 1, 0.36, 1],
                    }
                  : {
                      opacity: {
                        duration: 0.7,
                        ease: [0.22, 1, 0.36, 1],
                      },
                      x: {
                        duration: 0.7,
                        ease: [0.22, 1, 0.36, 1],
                      },
                      scale: {
                        duration: 0.7,
                        ease: [0.22, 1, 0.36, 1],
                      },
                      y: {
                        duration: 4.5,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      },
                    }
              }
              className="
                flex
                h-[200px]
                w-[250px]
                shrink-0
                justify-center
                lg:justify-start
              "
            >
              <img
                src={explore}
                alt="HiveMarket app"
                className="
                  h-full
                  w-full
                  object-cover
                  object-top
                  drop-shadow-[0_20px_25px_rgba(0,0,0,0.18)]
                "
              />
            </motion.div>

            {/* =================================================
                Copy
            ================================================== */}

            <div className="flex-1 text-center lg:text-left">

              <motion.h2
                initial={
                  shouldReduceMotion
                    ? {
                        opacity: 1,
                        y: 0,
                      }
                    : {
                        opacity: 0,
                        y: 20,
                      }
                }
                whileInView={{
                  opacity: 1,
                  y: 0,
                }}
                viewport={{
                  once: true,
                  amount: 0.25,
                }}
                transition={{
                  duration: 0.6,
                  delay: 0.15,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="
                  text-2xl
                  font-extrabold
                  leading-tight
                  tracking-[-0.5px]
                  text-white
                  sm:text-3xl
                  lg:text-[32px]
                "
              >
                Ready to simplify your campus shopping?
              </motion.h2>

              <motion.p
                initial={
                  shouldReduceMotion
                    ? {
                        opacity: 1,
                        y: 0,
                      }
                    : {
                        opacity: 0,
                        y: 15,
                      }
                }
                whileInView={{
                  opacity: 1,
                  y: 0,
                }}
                viewport={{
                  once: true,
                  amount: 0.25,
                }}
                transition={{
                  duration: 0.55,
                  delay: 0.28,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="
                  mx-auto
                  mt-3
                  max-w-md
                  text-sm
                  leading-6
                  text-white/75
                  lg:mx-0
                "
              >
                Download the HiveMarket app now and experience
                the best way to shop on campus.
              </motion.p>

            </div>

            {/* =================================================
                Download Buttons
            ================================================== */}

            <motion.div
              initial={
                shouldReduceMotion
                  ? {
                      opacity: 1,
                      x: 0,
                    }
                  : {
                      opacity: 0,
                      x: 25,
                    }
              }
              whileInView={{
                opacity: 1,
                x: 0,
              }}
              viewport={{
                once: true,
                amount: 0.25,
              }}
              transition={{
                duration: 0.65,
                delay: 0.3,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="
                flex
                w-full
                shrink-0
                flex-col
                gap-3
                sm:w-auto
                sm:flex-row
                lg:flex-col
              "
            >

              {/* =================================================
                  Android Button
              ================================================== */}

              <motion.a
                href="#"
                whileHover={
                  shouldReduceMotion
                    ? undefined
                    : {
                        y: -3,
                        scale: 1.02,
                        boxShadow:
                          '0 12px 25px rgba(0,0,0,0.15)',
                      }
                }
                whileTap={
                  shouldReduceMotion
                    ? undefined
                    : {
                        scale: 0.97,
                      }
                }
                transition={{
                  type: 'spring',
                  stiffness: 400,
                  damping: 20,
                }}
                className="
                  group
                  relative
                  flex
                  items-center
                  justify-center
                  gap-2
                  overflow-hidden
                  rounded-xl
                  bg-white
                  px-6
                  py-3
                  text-sm
                  font-semibold
                  text-[#008100]
                  shadow-sm
                "
              >
                {/* Shine */}

                {!shouldReduceMotion && (
                  <motion.span
                    initial={{
                      x: '-120%',
                    }}
                    animate={{
                      x: '120%',
                    }}
                    transition={{
                      duration: 1.2,
                      delay: 1.2,
                      repeat: Infinity,
                      repeatDelay: 5,
                      ease: 'easeInOut',
                    }}
                    className="
                      pointer-events-none
                      absolute
                      inset-y-0
                      w-8
                      -skew-x-12
                      bg-white/60
                      blur-sm
                    "
                  />
                )}

                <img
                  src={androidIcon}
                  alt="Android icon"
                  className="relative z-10 brightness-0"
                />

                <span className="relative z-10">
                  Download for Android
                </span>
              </motion.a>

              {/* =================================================
                  iOS Button
              ================================================== */}

              <motion.a
                href="#"
                whileHover={
                  shouldReduceMotion
                    ? undefined
                    : {
                        y: -3,
                        scale: 1.02,
                        boxShadow:
                          '0 12px 25px rgba(0,0,0,0.15)',
                      }
                }
                whileTap={
                  shouldReduceMotion
                    ? undefined
                    : {
                        scale: 0.97,
                      }
                }
                transition={{
                  type: 'spring',
                  stiffness: 400,
                  damping: 20,
                }}
                className="
                  flex
                  items-center
                  justify-center
                  gap-2
                  rounded-xl
                  bg-white
                  px-6
                  py-3
                  text-sm
                  font-semibold
                  text-[#17191c]
                  shadow-sm
                  transition-colors
                  duration-200
                  hover:bg-white/90
                "
              >
                <img
                  src={iosIcon}
                  alt="iOS icon"
                />

                Download on iOS
              </motion.a>

            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
