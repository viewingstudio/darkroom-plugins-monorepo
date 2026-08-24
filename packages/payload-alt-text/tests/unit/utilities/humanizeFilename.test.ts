import { describe, expect, test } from 'vitest'

import { humanizeFilename } from '../../../src/utilities/humanizeFilename.js'

describe('humanizeFilename', () => {
  test('returns empty string for null', () => {
    expect(humanizeFilename(null)).toBe('')
  })

  test('returns empty string for undefined', () => {
    expect(humanizeFilename(undefined)).toBe('')
  })

  test('returns empty string for empty string', () => {
    expect(humanizeFilename('')).toBe('')
  })

  test('returns empty string for a dotfile with no meaningful name', () => {
    expect(humanizeFilename('.gitkeep')).toBe('')
  })

  test('returns empty string for a hash-only filename', () => {
    expect(humanizeFilename('a1b2c3d4e5f6.jpg')).toBe('')
  })

  test('strips directory path', () => {
    expect(humanizeFilename('/uploads/photos/red-car.jpg')).toBe('Red car')
  })

  test('strips windows-style directory path', () => {
    expect(humanizeFilename('C:\\uploads\\red-car.jpg')).toBe('Red car')
  })

  test('strips the final extension only', () => {
    expect(humanizeFilename('my.file.name.jpg')).toBe('My file name')
  })

  test('replaces hyphens with spaces', () => {
    expect(humanizeFilename('red-sports-car.jpg')).toBe('Red sports car')
  })

  test('replaces underscores with spaces', () => {
    expect(humanizeFilename('red_sports_car.jpg')).toBe('Red sports car')
  })

  test('replaces plus signs with spaces', () => {
    expect(humanizeFilename('red+sports+car.jpg')).toBe('Red sports car')
  })

  test('replaces encoded %20 with spaces', () => {
    expect(humanizeFilename('red%20sports%20car.jpg')).toBe('Red sports car')
  })

  test('splits camelCase into words', () => {
    expect(humanizeFilename('redSportsCar.jpg')).toBe('Red Sports Car')
  })

  test('splits PascalCase into words', () => {
    expect(humanizeFilename('RedSportsCar.jpg')).toBe('Red Sports Car')
  })

  test('keeps an all-caps acronym intact aside from the leading capitalization', () => {
    expect(humanizeFilename('IMG_1234.jpg')).toBe('IMG 1234')
  })

  test('keeps short numeric tokens like image dimensions', () => {
    expect(humanizeFilename('sunset-1920x1080.jpg')).toBe('Sunset 1920x1080')
  })

  test('keeps short numbers such as 02', () => {
    expect(humanizeFilename('photo-02.jpg')).toBe('Photo 02')
  })

  test('drops a trailing pure-hex hash of 6+ chars', () => {
    expect(humanizeFilename('red-car-a1b2c3.jpg')).toBe('Red car')
  })

  test('drops a trailing UUID', () => {
    expect(humanizeFilename('red-car-123e4567-e89b-12d3-a456-426614174000.jpg')).toBe('Red car')
  })

  test('drops a trailing long digit run of 5+', () => {
    expect(humanizeFilename('red-car-123456.jpg')).toBe('Red car')
  })

  test('collapses whitespace and trims', () => {
    expect(humanizeFilename('  red   car  .jpg')).toBe('Red car')
  })

  test('capitalizes only the first letter, leaving remaining casing alone', () => {
    expect(humanizeFilename('photoIMG.jpg')).toBe('Photo IMG')
  })

  test('preserves unicode letters', () => {
    expect(humanizeFilename('café-au-lait.jpg')).toBe('Café au lait')
  })

  test('preserves unicode letters with camelCase splitting', () => {
    expect(humanizeFilename('caféLatte.jpg')).toBe('Café Latte')
  })

  test('returns empty string when nothing meaningful remains after stripping noise', () => {
    expect(humanizeFilename('123e4567-e89b-12d3-a456-426614174000.png')).toBe('')
  })
})
