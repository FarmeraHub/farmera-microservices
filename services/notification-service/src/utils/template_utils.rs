use std::collections::HashMap;

pub struct TemplateUtils;

impl TemplateUtils {
    pub fn generate_template_body(
        content: &str,
        template_props: &HashMap<String, String>,
    ) -> String {
        let mut content = content.to_string();
        for (key, val) in template_props {
            content = content.replace(&format!("{{{{{}}}}}", key), val);
        }
        content
    }
}
