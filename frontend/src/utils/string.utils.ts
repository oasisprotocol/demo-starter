export abstract class StringUtils {
  static clsx = (...classNames: (string | undefined)[]) => {
    return classNames
      .map(className => (className ? [className] : []))
      .flat()
      .join(' ')
  }

  static truncate = (s: string, sliceIndex = 200) => {
    return s.slice(0, sliceIndex)
  }
}
