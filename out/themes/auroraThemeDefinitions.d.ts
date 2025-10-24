/**
 * 🎨 Export all Aurora themes
 */
export const AURORA_THEMES: {
    id: string;
    name: string;
    description: string;
    category: string;
    colors: {
        primary: string;
        secondary: string;
        accent: string;
        tertiary: string;
        quaternary: string;
        warning: string;
        error: string;
        success: string;
        info: string;
    };
    backgrounds: {
        primary: string;
        secondary: string;
        tertiary: string;
        surface: string;
        elevated: string;
    };
    text: {
        primary: string;
        secondary: string;
        muted: string;
        inverse: string;
    };
    gradients: {
        primary: string;
        secondary: string;
        accent: string;
    };
    enterprise: {
        compliance: boolean;
        accessibility: string;
        auditRequired: boolean;
        version: string;
    };
    metadata: {
        created: string;
        author: string;
        tags: string[];
    };
}[];
export namespace THEME_UTILITIES {
    /**
     * Get theme by ID
     */
    function getThemeById(id: any): {
        id: string;
        name: string;
        description: string;
        category: string;
        colors: {
            primary: string;
            secondary: string;
            accent: string;
            tertiary: string;
            quaternary: string;
            warning: string;
            error: string;
            success: string;
            info: string;
        };
        backgrounds: {
            primary: string;
            secondary: string;
            tertiary: string;
            surface: string;
            elevated: string;
        };
        text: {
            primary: string;
            secondary: string;
            muted: string;
            inverse: string;
        };
        gradients: {
            primary: string;
            secondary: string;
            accent: string;
        };
        enterprise: {
            compliance: boolean;
            accessibility: string;
            auditRequired: boolean;
            version: string;
        };
        metadata: {
            created: string;
            author: string;
            tags: string[];
        };
    } | undefined;
    /**
     * Get themes by category
     */
    function getThemesByCategory(category: any): {
        id: string;
        name: string;
        description: string;
        category: string;
        colors: {
            primary: string;
            secondary: string;
            accent: string;
            tertiary: string;
            quaternary: string;
            warning: string;
            error: string;
            success: string;
            info: string;
        };
        backgrounds: {
            primary: string;
            secondary: string;
            tertiary: string;
            surface: string;
            elevated: string;
        };
        text: {
            primary: string;
            secondary: string;
            muted: string;
            inverse: string;
        };
        gradients: {
            primary: string;
            secondary: string;
            accent: string;
        };
        enterprise: {
            compliance: boolean;
            accessibility: string;
            auditRequired: boolean;
            version: string;
        };
        metadata: {
            created: string;
            author: string;
            tags: string[];
        };
    }[];
    /**
     * Get dark themes
     */
    function getDarkThemes(): {
        id: string;
        name: string;
        description: string;
        category: string;
        colors: {
            primary: string;
            secondary: string;
            accent: string;
            tertiary: string;
            quaternary: string;
            warning: string;
            error: string;
            success: string;
            info: string;
        };
        backgrounds: {
            primary: string;
            secondary: string;
            tertiary: string;
            surface: string;
            elevated: string;
        };
        text: {
            primary: string;
            secondary: string;
            muted: string;
            inverse: string;
        };
        gradients: {
            primary: string;
            secondary: string;
            accent: string;
        };
        enterprise: {
            compliance: boolean;
            accessibility: string;
            auditRequired: boolean;
            version: string;
        };
        metadata: {
            created: string;
            author: string;
            tags: string[];
        };
    }[];
    /**
     * Get light themes
     */
    function getLightThemes(): {
        id: string;
        name: string;
        description: string;
        category: string;
        colors: {
            primary: string;
            secondary: string;
            accent: string;
            tertiary: string;
            quaternary: string;
            warning: string;
            error: string;
            success: string;
            info: string;
        };
        backgrounds: {
            primary: string;
            secondary: string;
            tertiary: string;
            surface: string;
            elevated: string;
        };
        text: {
            primary: string;
            secondary: string;
            muted: string;
            inverse: string;
        };
        gradients: {
            primary: string;
            secondary: string;
            accent: string;
        };
        enterprise: {
            compliance: boolean;
            accessibility: string;
            auditRequired: boolean;
            version: string;
        };
        metadata: {
            created: string;
            author: string;
            tags: string[];
        };
    }[];
    /**
     * Validate theme structure
     */
    function validateTheme(theme: any): boolean;
    /**
     * Get theme preview data
     */
    function getThemePreview(themeId: any): {
        id: string;
        name: string;
        category: string;
        colors: {
            primary: string;
            secondary: string;
            accent: string;
        };
        background: string;
    } | null;
}
export namespace CLASSIC_AURORA {
    let id: string;
    let name: string;
    let description: string;
    let category: string;
    namespace colors {
        let primary: string;
        let secondary: string;
        let accent: string;
        let tertiary: string;
        let quaternary: string;
        let warning: string;
        let error: string;
        let success: string;
        let info: string;
    }
    namespace backgrounds {
        let primary_1: string;
        export { primary_1 as primary };
        let secondary_1: string;
        export { secondary_1 as secondary };
        let tertiary_1: string;
        export { tertiary_1 as tertiary };
        export let surface: string;
        export let elevated: string;
    }
    namespace text {
        let primary_2: string;
        export { primary_2 as primary };
        let secondary_2: string;
        export { secondary_2 as secondary };
        export let muted: string;
        export let inverse: string;
    }
    namespace gradients {
        let primary_3: string;
        export { primary_3 as primary };
        let secondary_3: string;
        export { secondary_3 as secondary };
        let accent_1: string;
        export { accent_1 as accent };
    }
    namespace enterprise {
        let compliance: boolean;
        let accessibility: string;
        let auditRequired: boolean;
        let version: string;
    }
    namespace metadata {
        let created: string;
        let author: string;
        let tags: string[];
    }
}
export namespace FIRE_AURORA {
    let id_1: string;
    export { id_1 as id };
    let name_1: string;
    export { name_1 as name };
    let description_1: string;
    export { description_1 as description };
    let category_1: string;
    export { category_1 as category };
    export namespace colors_1 {
        let primary_4: string;
        export { primary_4 as primary };
        let secondary_4: string;
        export { secondary_4 as secondary };
        let accent_2: string;
        export { accent_2 as accent };
        let tertiary_2: string;
        export { tertiary_2 as tertiary };
        let quaternary_1: string;
        export { quaternary_1 as quaternary };
        let warning_1: string;
        export { warning_1 as warning };
        let error_1: string;
        export { error_1 as error };
        let success_1: string;
        export { success_1 as success };
        let info_1: string;
        export { info_1 as info };
    }
    export { colors_1 as colors };
    export namespace backgrounds_1 {
        let primary_5: string;
        export { primary_5 as primary };
        let secondary_5: string;
        export { secondary_5 as secondary };
        let tertiary_3: string;
        export { tertiary_3 as tertiary };
        let surface_1: string;
        export { surface_1 as surface };
        let elevated_1: string;
        export { elevated_1 as elevated };
    }
    export { backgrounds_1 as backgrounds };
    export namespace text_1 {
        let primary_6: string;
        export { primary_6 as primary };
        let secondary_6: string;
        export { secondary_6 as secondary };
        let muted_1: string;
        export { muted_1 as muted };
        let inverse_1: string;
        export { inverse_1 as inverse };
    }
    export { text_1 as text };
    export namespace gradients_1 {
        let primary_7: string;
        export { primary_7 as primary };
        let secondary_7: string;
        export { secondary_7 as secondary };
        let accent_3: string;
        export { accent_3 as accent };
    }
    export { gradients_1 as gradients };
    export namespace enterprise_1 {
        let compliance_1: boolean;
        export { compliance_1 as compliance };
        let accessibility_1: string;
        export { accessibility_1 as accessibility };
        let auditRequired_1: boolean;
        export { auditRequired_1 as auditRequired };
        let version_1: string;
        export { version_1 as version };
    }
    export { enterprise_1 as enterprise };
    export namespace metadata_1 {
        let created_1: string;
        export { created_1 as created };
        let author_1: string;
        export { author_1 as author };
        let tags_1: string[];
        export { tags_1 as tags };
    }
    export { metadata_1 as metadata };
}
export namespace FOREST_AURORA {
    let id_2: string;
    export { id_2 as id };
    let name_2: string;
    export { name_2 as name };
    let description_2: string;
    export { description_2 as description };
    let category_2: string;
    export { category_2 as category };
    export namespace colors_2 {
        let primary_8: string;
        export { primary_8 as primary };
        let secondary_8: string;
        export { secondary_8 as secondary };
        let accent_4: string;
        export { accent_4 as accent };
        let tertiary_4: string;
        export { tertiary_4 as tertiary };
        let quaternary_2: string;
        export { quaternary_2 as quaternary };
        let warning_2: string;
        export { warning_2 as warning };
        let error_2: string;
        export { error_2 as error };
        let success_2: string;
        export { success_2 as success };
        let info_2: string;
        export { info_2 as info };
    }
    export { colors_2 as colors };
    export namespace backgrounds_2 {
        let primary_9: string;
        export { primary_9 as primary };
        let secondary_9: string;
        export { secondary_9 as secondary };
        let tertiary_5: string;
        export { tertiary_5 as tertiary };
        let surface_2: string;
        export { surface_2 as surface };
        let elevated_2: string;
        export { elevated_2 as elevated };
    }
    export { backgrounds_2 as backgrounds };
    export namespace text_2 {
        let primary_10: string;
        export { primary_10 as primary };
        let secondary_10: string;
        export { secondary_10 as secondary };
        let muted_2: string;
        export { muted_2 as muted };
        let inverse_2: string;
        export { inverse_2 as inverse };
    }
    export { text_2 as text };
    export namespace gradients_2 {
        let primary_11: string;
        export { primary_11 as primary };
        let secondary_11: string;
        export { secondary_11 as secondary };
        let accent_5: string;
        export { accent_5 as accent };
    }
    export { gradients_2 as gradients };
    export namespace enterprise_2 {
        let compliance_2: boolean;
        export { compliance_2 as compliance };
        let accessibility_2: string;
        export { accessibility_2 as accessibility };
        let auditRequired_2: boolean;
        export { auditRequired_2 as auditRequired };
        let version_2: string;
        export { version_2 as version };
    }
    export { enterprise_2 as enterprise };
    export namespace metadata_2 {
        let created_2: string;
        export { created_2 as created };
        let author_2: string;
        export { author_2 as author };
        let tags_2: string[];
        export { tags_2 as tags };
    }
    export { metadata_2 as metadata };
}
export namespace SAKURA_AURORA {
    let id_3: string;
    export { id_3 as id };
    let name_3: string;
    export { name_3 as name };
    let description_3: string;
    export { description_3 as description };
    let category_3: string;
    export { category_3 as category };
    export namespace colors_3 {
        let primary_12: string;
        export { primary_12 as primary };
        let secondary_12: string;
        export { secondary_12 as secondary };
        let accent_6: string;
        export { accent_6 as accent };
        let tertiary_6: string;
        export { tertiary_6 as tertiary };
        let quaternary_3: string;
        export { quaternary_3 as quaternary };
        let warning_3: string;
        export { warning_3 as warning };
        let error_3: string;
        export { error_3 as error };
        let success_3: string;
        export { success_3 as success };
        let info_3: string;
        export { info_3 as info };
    }
    export { colors_3 as colors };
    export namespace backgrounds_3 {
        let primary_13: string;
        export { primary_13 as primary };
        let secondary_13: string;
        export { secondary_13 as secondary };
        let tertiary_7: string;
        export { tertiary_7 as tertiary };
        let surface_3: string;
        export { surface_3 as surface };
        let elevated_3: string;
        export { elevated_3 as elevated };
    }
    export { backgrounds_3 as backgrounds };
    export namespace text_3 {
        let primary_14: string;
        export { primary_14 as primary };
        let secondary_14: string;
        export { secondary_14 as secondary };
        let muted_3: string;
        export { muted_3 as muted };
        let inverse_3: string;
        export { inverse_3 as inverse };
    }
    export { text_3 as text };
    export namespace gradients_3 {
        let primary_15: string;
        export { primary_15 as primary };
        let secondary_15: string;
        export { secondary_15 as secondary };
        let accent_7: string;
        export { accent_7 as accent };
    }
    export { gradients_3 as gradients };
    export namespace enterprise_3 {
        let compliance_3: boolean;
        export { compliance_3 as compliance };
        let accessibility_3: string;
        export { accessibility_3 as accessibility };
        let auditRequired_3: boolean;
        export { auditRequired_3 as auditRequired };
        let version_3: string;
        export { version_3 as version };
    }
    export { enterprise_3 as enterprise };
    export namespace metadata_3 {
        let created_3: string;
        export { created_3 as created };
        let author_3: string;
        export { author_3 as author };
        let tags_3: string[];
        export { tags_3 as tags };
    }
    export { metadata_3 as metadata };
}
export namespace MIDNIGHT_AURORA {
    let id_4: string;
    export { id_4 as id };
    let name_4: string;
    export { name_4 as name };
    let description_4: string;
    export { description_4 as description };
    let category_4: string;
    export { category_4 as category };
    export namespace colors_4 {
        let primary_16: string;
        export { primary_16 as primary };
        let secondary_16: string;
        export { secondary_16 as secondary };
        let accent_8: string;
        export { accent_8 as accent };
        let tertiary_8: string;
        export { tertiary_8 as tertiary };
        let quaternary_4: string;
        export { quaternary_4 as quaternary };
        let warning_4: string;
        export { warning_4 as warning };
        let error_4: string;
        export { error_4 as error };
        let success_4: string;
        export { success_4 as success };
        let info_4: string;
        export { info_4 as info };
    }
    export { colors_4 as colors };
    export namespace backgrounds_4 {
        let primary_17: string;
        export { primary_17 as primary };
        let secondary_17: string;
        export { secondary_17 as secondary };
        let tertiary_9: string;
        export { tertiary_9 as tertiary };
        let surface_4: string;
        export { surface_4 as surface };
        let elevated_4: string;
        export { elevated_4 as elevated };
    }
    export { backgrounds_4 as backgrounds };
    export namespace text_4 {
        let primary_18: string;
        export { primary_18 as primary };
        let secondary_18: string;
        export { secondary_18 as secondary };
        let muted_4: string;
        export { muted_4 as muted };
        let inverse_4: string;
        export { inverse_4 as inverse };
    }
    export { text_4 as text };
    export namespace gradients_4 {
        let primary_19: string;
        export { primary_19 as primary };
        let secondary_19: string;
        export { secondary_19 as secondary };
        let accent_9: string;
        export { accent_9 as accent };
    }
    export { gradients_4 as gradients };
    export namespace enterprise_4 {
        let compliance_4: boolean;
        export { compliance_4 as compliance };
        let accessibility_4: string;
        export { accessibility_4 as accessibility };
        let auditRequired_4: boolean;
        export { auditRequired_4 as auditRequired };
        let version_4: string;
        export { version_4 as version };
    }
    export { enterprise_4 as enterprise };
    export namespace metadata_4 {
        let created_4: string;
        export { created_4 as created };
        let author_4: string;
        export { author_4 as author };
        let tags_4: string[];
        export { tags_4 as tags };
    }
    export { metadata_4 as metadata };
}
export namespace SOLAR_AURORA {
    let id_5: string;
    export { id_5 as id };
    let name_5: string;
    export { name_5 as name };
    let description_5: string;
    export { description_5 as description };
    let category_5: string;
    export { category_5 as category };
    export namespace colors_5 {
        let primary_20: string;
        export { primary_20 as primary };
        let secondary_20: string;
        export { secondary_20 as secondary };
        let accent_10: string;
        export { accent_10 as accent };
        let tertiary_10: string;
        export { tertiary_10 as tertiary };
        let quaternary_5: string;
        export { quaternary_5 as quaternary };
        let warning_5: string;
        export { warning_5 as warning };
        let error_5: string;
        export { error_5 as error };
        let success_5: string;
        export { success_5 as success };
        let info_5: string;
        export { info_5 as info };
    }
    export { colors_5 as colors };
    export namespace backgrounds_5 {
        let primary_21: string;
        export { primary_21 as primary };
        let secondary_21: string;
        export { secondary_21 as secondary };
        let tertiary_11: string;
        export { tertiary_11 as tertiary };
        let surface_5: string;
        export { surface_5 as surface };
        let elevated_5: string;
        export { elevated_5 as elevated };
    }
    export { backgrounds_5 as backgrounds };
    export namespace text_5 {
        let primary_22: string;
        export { primary_22 as primary };
        let secondary_22: string;
        export { secondary_22 as secondary };
        let muted_5: string;
        export { muted_5 as muted };
        let inverse_5: string;
        export { inverse_5 as inverse };
    }
    export { text_5 as text };
    export namespace gradients_5 {
        let primary_23: string;
        export { primary_23 as primary };
        let secondary_23: string;
        export { secondary_23 as secondary };
        let accent_11: string;
        export { accent_11 as accent };
    }
    export { gradients_5 as gradients };
    export namespace enterprise_5 {
        let compliance_5: boolean;
        export { compliance_5 as compliance };
        let accessibility_5: string;
        export { accessibility_5 as accessibility };
        let auditRequired_5: boolean;
        export { auditRequired_5 as auditRequired };
        let version_5: string;
        export { version_5 as version };
    }
    export { enterprise_5 as enterprise };
    export namespace metadata_5 {
        let created_5: string;
        export { created_5 as created };
        let author_5: string;
        export { author_5 as author };
        let tags_5: string[];
        export { tags_5 as tags };
    }
    export { metadata_5 as metadata };
}
//# sourceMappingURL=auroraThemeDefinitions.d.ts.map