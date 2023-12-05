import { Picker } from 'emoji-mart';

const PICKER_OPTIONS = {
  locale: 'ru',
  navPosition: 'top',
  noCountryFlags: true,
  previewPosition: 'none',
  theme: 'dark',
  dynamicWidth: true,
};

const picker = new Picker(PICKER_OPTIONS);

export default picker;
