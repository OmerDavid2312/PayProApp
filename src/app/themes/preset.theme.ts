import { definePreset } from '@primeng/themes';
import Aura from '@primeng/themes/aura';

const MyPreset = definePreset(Aura, {
    semantic: {
        primary: {
            50: '{blue.50}',
            100: '{blue.100}',
            200: '{blue.200}',
            300: '{blue.300}',
            400: '{blue.400}',
            500: '{blue.500}',
            600: '{blue.600}',
            700: '{blue.700}',
            800: '{blue.800}',
            900: '{blue.900}',
            950: '{blue.950}'
        },
        colorScheme: {
            light: {
                primary: {
                    color: '{blue.600}',
                    hoverColor: '{blue.800}',
                    activeColor: '{blue.700}'
                },
                highlight: {
                    background: '{blue.600}',
                    focusBackground: '{blue.700}',
                    color: '#ffffff',
                    focusColor: '#ffffff'
                }
            },
            dark: {
                primary: {
                    color: '{blue.400}',
                    hoverColor: '{blue.300}',
                    activeColor: '{blue.200}'
                },
                highlight: {
                    background: 'rgba(96, 165, 250, 0.16)',
                    focusBackground: 'rgba(96, 165, 250, 0.24)',
                    color: 'rgba(255,255,255,.87)',
                    focusColor: 'rgba(255,255,255,.87)'
                }
            }
        }
    }
});

export { MyPreset };
